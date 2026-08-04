/**
 * AI Feed Digest - GAS 側バッチ（MVP）
 *
 * 使い方:
 * 1. script.google.com で新規プロジェクト作成
 * 2. このファイル内容を貼り付け
 * 3. プロジェクトの設定 > スクリプト プロパティ に以下を追加
 *    - GOOGLE_API_KEY : Gemini API キー
 *    - INGEST_URL     : https://<your-vercel-app>.vercel.app/api/ingest
 *    - INGEST_SECRET  : Vercel と同じ秘密文字列
 *    - SLACK_WEBHOOK_URL : (任意) Incoming Webhook URL。未設定なら通知スキップ
 *    - APP_BASE_URL   : (任意) https://<your-vercel-app>.vercel.app
 *    - GEMINI_MODEL   : (任意) 既定 gemini-3.5-flash-lite
 * 4. runOnce を手動実行して認可
 * 5. createDailyTrigger を実行
 */

var FEEDS = [
  {
    source: "OpenAI",
    url: "https://openai.com/news/rss.xml",
  },
  {
    source: "Claude",
    // Anthropic公式ブログの安定RSSがないため、公開メンテのフィードを利用
    url: "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_claude.xml",
  },
  {
    source: "Claude Code",
    url: "https://code.claude.com/docs/en/changelog/rss.xml",
  },
  {
    source: "Anthropic News",
    // Anthropic公式RSSがないため、公開メンテのフィードを利用
    url: "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml",
  },
  {
    source: "Google DeepMind",
    url: "https://deepmind.google/blog/rss.xml",
  },
  {
    source: "Google AI",
    url: "https://blog.google/technology/ai/rss/",
  },
  {
    source: "Gemini",
    url: "https://blog.google/products/gemini/rss/",
  },
  {
    source: "Cursor Changelog",
    url: "https://cursor.com/changelog/rss.xml",
  },
  {
    source: "Cursor Blog",
    // 公式 blog RSS が不安定なため、公開メンテのフィードを利用
    url: "https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_cursor.xml",
  },
  {
    source: "Laravel",
    url: "https://blog.laravel.com/feed",
  },
  {
    source: "Laravel Framework",
    url: "https://github.com/laravel/framework/releases.atom",
  },
  {
    source: "Vercel",
    url: "https://vercel.com/atom",
  },
  {
    source: "Next.js",
    url: "https://nextjs.org/feed.xml",
  },
  {
    source: "GitHub Changelog",
    url: "https://github.blog/changelog/feed/",
  },
  {
    source: "Cloudflare",
    url: "https://blog.cloudflare.com/rss/",
  },
  {
    source: "Supabase",
    url: "https://supabase.com/rss.xml",
  },
  {
    source: "AWS",
    // AI / ML 更新中心（Bedrock / SageMaker 等）
    url: "https://aws.amazon.com/blogs/machine-learning/feed/",
  },
];

var DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
var MAX_ITEMS_PER_FEED = 2;
var SLEEP_MS_BETWEEN_CALLS = 8000;

function runOnce() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty("GOOGLE_API_KEY");
  var ingestUrl = props.getProperty("INGEST_URL");
  var ingestSecret = props.getProperty("INGEST_SECRET");
  var slackWebhook = props.getProperty("SLACK_WEBHOOK_URL");
  var appBaseUrl = props.getProperty("APP_BASE_URL");
  var geminiModel = props.getProperty("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL;

  if (!apiKey || !ingestUrl || !ingestSecret) {
    throw new Error(
      "Script Properties に GOOGLE_API_KEY / INGEST_URL / INGEST_SECRET を設定してください",
    );
  }

  Logger.log("using model=" + geminiModel);

  var seen = loadSeen_();
  var ingested = [];
  var errors = [];

  FEEDS.forEach(function (feed) {
    try {
      var items = fetchRssItems_(feed.url).slice(0, MAX_ITEMS_PER_FEED);
      items.forEach(function (item) {
        if (seen[item.link]) return;

        var bodyText = item.description || item.title;
        var summary = summarizeWithGemini_(
          apiKey,
          geminiModel,
          feed.source,
          item.title,
          bodyText,
        );

        var payload = {
          source: feed.source,
          title: summary.title || item.title,
          url: item.link,
          publishedAt: item.pubDate || new Date().toISOString(),
          summary: {
            general: summary.general,
            engineer: summary.engineer,
          },
        };

        postIngest_(ingestUrl, ingestSecret, payload);
        seen[item.link] = true;
        ingested.push(payload);

        // 無料枠の RPM 制限を避ける
        Utilities.sleep(SLEEP_MS_BETWEEN_CALLS);
      });
    } catch (e) {
      errors.push(feed.source + ": " + e.message);
      Logger.log("feed error (" + feed.source + "): " + e.message);
      // 429 のときは少し待って次フィードへ
      if (String(e.message).indexOf("429") !== -1) {
        Utilities.sleep(35000);
      }
    }
  });

  saveSeen_(seen);

  if (ingested.length > 0) {
    notifySlack_(slackWebhook, appBaseUrl, ingested);
  } else {
    Logger.log("no new articles");
  }

  Logger.log("ingested=" + ingested.length + " errors=" + errors.length);
  if (errors.length) {
    Logger.log("errors: " + errors.join(" | "));
  }
}

function createDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "runOnce") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("runOnce").timeBased().everyDays(1).atHour(8).create();
}

/**
 * Slack Incoming Webhook へ通知。
 * SLACK_WEBHOOK_URL 未設定なら何もしない（後から有効化可能）。
 */
function notifySlack_(webhookUrl, appBaseUrl, articles) {
  if (!webhookUrl) {
    Logger.log("SLACK_WEBHOOK_URL unset — skip Slack notify");
    return;
  }

  var lines = articles.map(function (a, i) {
    var conclusionSource =
      (a.summary &&
        a.summary.general &&
        a.summary.general.conclusion) ||
      (a.summary && a.summary.conclusion) ||
      "";
    var conclusion = String(conclusionSource)
      .replace(/\\n/g, " ")
      .replace(/\n/g, " ")
      .slice(0, 120);
    return (
      "*" +
      (i + 1) +
      ". [" +
      a.source +
      "] " +
      a.title +
      "*\n" +
      conclusion +
      "\n<" +
      a.url +
      "|元記事>"
    );
  });

  var text =
    ":sparkles: *ようやくわかる* に新着 " +
    articles.length +
    " 件\n\n" +
    lines.join("\n\n");

  if (appBaseUrl) {
    text += "\n\n<" + appBaseUrl.replace(/\/$/, "") + "|アプリで見る>";
  }

  var response = UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ text: text }),
    muteHttpExceptions: true,
  });

  var status = response.getResponseCode();
  if (status >= 300) {
    throw new Error(
      "Slack notify failed: " + status + " " + response.getContentText(),
    );
  }
  Logger.log("slack notified=" + articles.length);
}

function summarizeWithGemini_(apiKey, model, source, title, bodyText) {
  var endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    model +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  var prompt =
    "あなたはAIプロダクト更新を、読者別に翻訳する編集者です。\n" +
    "同じ事実を『非エンジニア向け』と『エンジニア向け』の2ボイスで日本語要約してください。\n" +
    "必ず次のJSONだけを返してください（前後に説明文やコードフェンス禁止）。\n" +
    "文字列の中に実際の改行・タブを入れないでください。conclusion は配列で返してください。\n" +
    "{\n" +
    '  "title": "共通の日本語見出し（簡潔・ニュース見出し調）",\n' +
    '  "general": {\n' +
    '    "conclusion": ["非エンジニア向け結論1", "結論2", "結論3"],\n' +
    '    "situations": ["使える場面1", "2", "3"],\n' +
    '    "terms": [{"term":"用語","plain":"一口解説"}]\n' +
    "  },\n" +
    '  "engineer": {\n' +
    '    "conclusion": ["エンジニア向け結論1", "結論2", "結論3"],\n' +
    '    "situations": ["使える場面1", "2", "3"],\n' +
    '    "terms": [{"term":"用語","plain":"正確で短い定義"}]\n' +
    "  }\n" +
    "}\n\n" +
    "要件:\n" +
    "- title は必ず日本語。固有名詞（Next.js / Claude 等）だけ英語可\n" +
    "- 事実関係は両ボイスで一致させる。言い方だけ変える\n" +
    "- general: 専門用語を避けるか直後に噛み砕く。企画・営業・事務でも分かる言い方\n" +
    "- engineer: 正確な用語OK。実装・運用・互換性への影響を明確に\n" +
    "- conclusion は各ボイス3要素の配列。1要素は1文\n" +
    "- situations は各ボイス3点。読者の現実業務に寄せる\n" +
    "- terms は記事理解に必要な語だけ0〜5件。plain は1文で簡潔に\n" +
    "- やや詳しめ。ただし冗長にしない\n" +
    "- 不明点は推測で埋めない\n" +
    "- JSONとして必ずパースできる形で返す（末尾カンマ禁止）\n\n" +
    "source: " +
    source +
    "\n" +
    "title: " +
    title +
    "\n" +
    "body:\n" +
    String(bodyText).slice(0, 8000);

  var lastError = null;
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      var response = UrlFetchApp.fetch(endpoint, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
        muteHttpExceptions: true,
      });

      var status = response.getResponseCode();
      var text = response.getContentText();
      if (status === 429) {
        lastError = new Error("Gemini API error: " + status + " " + text);
        Utilities.sleep(attempt * 20000);
        continue;
      }
      if (status >= 300) {
        throw new Error("Gemini API error: " + status + " " + text);
      }

      var data = JSON.parse(text);
      var raw = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      var content = (raw[0] && raw[0].text) || "";
      var parsed = parseModelJson_(content);
      if (!parsed.general || !parsed.engineer) {
        throw new Error("Gemini response missing fields: " + content);
      }
      return {
        title: normalizePlainText_(parsed.title || title),
        general: normalizeAudienceSummary_(parsed.general),
        engineer: normalizeAudienceSummary_(parsed.engineer),
      };
    } catch (e) {
      lastError = e;
      Logger.log(
        "summarize retry " + attempt + ": " + (e && e.message ? e.message : e),
      );
      Utilities.sleep(attempt * 3000);
    }
  }

  throw lastError || new Error("Gemini API failed after retries");
}

/** 文字としての \\n を実改行へ */
function normalizeMultilineText_(value) {
  return String(value || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\r\n/g, "\n")
    .trim();
}

function normalizePlainText_(value) {
  return normalizeMultilineText_(value)
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}

function normalizeAudienceSummary_(raw) {
  var source = raw || {};
  var situations = (source.situations || [])
    .map(function (s) {
      return normalizePlainText_(s);
    })
    .filter(Boolean)
    .slice(0, 3);
  while (situations.length < 3) {
    situations.push("（シチュエーション未入力）");
  }

  var terms = (source.terms || [])
    .map(function (t) {
      if (!t) return null;
      var term = normalizePlainText_(t.term || "");
      var plain = normalizePlainText_(t.plain || "");
      if (!term || !plain) return null;
      return { term: term, plain: plain };
    })
    .filter(Boolean)
    .slice(0, 5);

  return {
    conclusion: conclusionToText_(source.conclusion) || "（結論未入力）",
    situations: situations,
    terms: terms,
  };
}

function conclusionToText_(value) {
  if (Object.prototype.toString.call(value) === "[object Array]") {
    return value
      .map(function (line) {
        return normalizePlainText_(line);
      })
      .filter(Boolean)
      .slice(0, 5)
      .join("\n");
  }
  return normalizeMultilineText_(value);
}

/** モデル出力をできるだけJSONとして読む */
function parseModelJson_(content) {
  var cleaned = String(content || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  var start = cleaned.indexOf("{");
  var end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    var sanitized = sanitizeJsonControlChars_(cleaned).replace(
      /,\s*([}\]])/g,
      "$1",
    );
    return JSON.parse(sanitized);
  }
}

/** JSON文字列リテラル内の生改行などをエスケープ */
function sanitizeJsonControlChars_(text) {
  var out = "";
  var inString = false;
  var escaped = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    var code = text.charCodeAt(i);
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        out += ch;
        inString = false;
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        out += "\\r";
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
      if (code < 32) continue;
      out += ch;
    } else {
      if (ch === '"') inString = true;
      out += ch;
    }
  }
  return out;
}

/**
 * 既存記事の英語タイトルと結論内の \\n を直し、再 ingest する。
 * APP_BASE_URL / INGEST_URL / INGEST_SECRET / GOOGLE_API_KEY が必要。
 */
function repairExistingArticles() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty("GOOGLE_API_KEY");
  var ingestUrl = props.getProperty("INGEST_URL");
  var ingestSecret = props.getProperty("INGEST_SECRET");
  var appBaseUrl = (props.getProperty("APP_BASE_URL") || "").replace(/\/$/, "");
  var geminiModel = props.getProperty("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL;

  if (!apiKey || !ingestUrl || !ingestSecret || !appBaseUrl) {
    throw new Error(
      "GOOGLE_API_KEY / INGEST_URL / INGEST_SECRET / APP_BASE_URL を設定してください",
    );
  }

  var response = UrlFetchApp.fetch(appBaseUrl + "/api/articles", {
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 300) {
    throw new Error(
      "articles fetch failed: " +
        response.getResponseCode() +
        " " +
        response.getContentText(),
    );
  }

  var data = JSON.parse(response.getContentText());
  var articles = data.articles || [];
  var fixed = 0;
  var skipped = 0;
  var errors = [];

  articles.forEach(function (article) {
    try {
      var summary = article.summary || {};
      var hasDual = summary.general && summary.engineer;
      var generalConclusion = hasDual
        ? normalizeMultilineText_(summary.general.conclusion)
        : normalizeMultilineText_(summary.conclusion);
      var engineerConclusion = hasDual
        ? normalizeMultilineText_(summary.engineer.conclusion)
        : generalConclusion;
      var rawGeneral = hasDual
        ? String(summary.general.conclusion || "")
        : String(summary.conclusion || "");
      var rawEngineer = hasDual
        ? String(summary.engineer.conclusion || "")
        : rawGeneral;

      var needsTitle = looksEnglishTitle_(article.title);
      var needsConclusion =
        rawGeneral.indexOf("\\n") !== -1 || rawEngineer.indexOf("\\n") !== -1;
      if (!needsTitle && !needsConclusion) {
        skipped += 1;
        return;
      }

      var titleJa = article.title;
      if (needsTitle) {
        titleJa = translateTitleWithGemini_(
          apiKey,
          geminiModel,
          article.source,
          article.title,
          generalConclusion,
        );
        Utilities.sleep(SLEEP_MS_BETWEEN_CALLS);
      }

      var payloadSummary;
      if (hasDual) {
        payloadSummary = {
          general: {
            conclusion: generalConclusion,
            situations: (summary.general.situations || []).map(
              normalizePlainText_,
            ),
            terms: summary.general.terms || [],
          },
          engineer: {
            conclusion: engineerConclusion,
            situations: (summary.engineer.situations || []).map(
              normalizePlainText_,
            ),
            terms: summary.engineer.terms || [],
          },
        };
      } else {
        payloadSummary = {
          conclusion: generalConclusion,
          situations: (summary.situations || []).map(normalizePlainText_),
        };
      }

      postIngest_(ingestUrl, ingestSecret, {
        source: article.source,
        title: titleJa,
        url: article.url,
        publishedAt: article.publishedAt,
        summary: payloadSummary,
      });
      fixed += 1;
      Logger.log("repaired: " + article.title + " -> " + titleJa);
    } catch (e) {
      errors.push(article.title + ": " + e.message);
      Logger.log("repair error: " + e.message);
    }
  });

  Logger.log(
    "repair done fixed=" +
      fixed +
      " skipped=" +
      skipped +
      " errors=" +
      errors.length,
  );
  if (errors.length) Logger.log("errors: " + errors.join(" | "));
}

/**
 * 既存記事を『非エンジニア向け / エンジニア向け』の2ボイスで再要約して上書きする。
 *
 * 使い方:
 * 1. APP_BASE_URL / INGEST_URL / INGEST_SECRET / GOOGLE_API_KEY を設定
 * 2. エディタで backfillDualVoiceArticles を実行
 * 3. 件数が多い場合は何度か実行（続きから進む）
 *
 * 任意プロパティ:
 * - BACKFILL_LIMIT  : 1回あたり処理件数（既定 12）
 * - BACKFILL_CURSOR : 進捗（自動更新。最初からやり直すなら 0 をセット）
 */
function backfillDualVoiceArticles() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty("GOOGLE_API_KEY");
  var ingestUrl = props.getProperty("INGEST_URL");
  var ingestSecret = props.getProperty("INGEST_SECRET");
  var appBaseUrl = (props.getProperty("APP_BASE_URL") || "").replace(/\/$/, "");
  var geminiModel = props.getProperty("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL;
  var limit = Number(props.getProperty("BACKFILL_LIMIT") || 12);
  var cursor = Number(props.getProperty("BACKFILL_CURSOR") || 0);

  if (!apiKey || !ingestUrl || !ingestSecret || !appBaseUrl) {
    throw new Error(
      "GOOGLE_API_KEY / INGEST_URL / INGEST_SECRET / APP_BASE_URL を設定してください",
    );
  }
  if (!isFinite(limit) || limit < 1) limit = 12;
  if (!isFinite(cursor) || cursor < 0) cursor = 0;

  var response = UrlFetchApp.fetch(appBaseUrl + "/api/articles", {
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 300) {
    throw new Error(
      "articles fetch failed: " +
        response.getResponseCode() +
        " " +
        response.getContentText(),
    );
  }

  var data = JSON.parse(response.getContentText());
  var articles = data.articles || [];
  var slice = articles.slice(cursor, cursor + limit);
  var updated = 0;
  var errors = [];

  Logger.log(
    "backfill start total=" +
      articles.length +
      " cursor=" +
      cursor +
      " limit=" +
      limit +
      " batch=" +
      slice.length,
  );

  slice.forEach(function (article, index) {
    try {
      var bodyText = buildBackfillBody_(article);
      var summary = summarizeWithGemini_(
        apiKey,
        geminiModel,
        article.source,
        article.title,
        bodyText,
      );

      postIngest_(ingestUrl, ingestSecret, {
        source: article.source,
        title: summary.title || article.title,
        url: article.url,
        publishedAt: article.publishedAt,
        summary: {
          general: summary.general,
          engineer: summary.engineer,
        },
      });
      updated += 1;
      Logger.log(
        "backfilled (" +
          (cursor + index + 1) +
          "/" +
          articles.length +
          "): " +
          article.title,
      );
      Utilities.sleep(SLEEP_MS_BETWEEN_CALLS);
    } catch (e) {
      errors.push(article.title + ": " + e.message);
      Logger.log("backfill error: " + e.message);
      if (String(e.message).indexOf("429") !== -1) {
        Utilities.sleep(35000);
      }
    }
  });

  var nextCursor = cursor + slice.length;
  if (nextCursor >= articles.length) {
    props.setProperty("BACKFILL_CURSOR", "0");
    Logger.log("backfill complete — cursor reset to 0");
  } else {
    props.setProperty("BACKFILL_CURSOR", String(nextCursor));
    Logger.log(
      "backfill paused — run again to continue from cursor=" + nextCursor,
    );
  }

  Logger.log(
    "backfill done updated=" + updated + " errors=" + errors.length,
  );
  if (errors.length) Logger.log("errors: " + errors.join(" | "));
}

/** 既存要約を材料にして再要約用本文を作る */
function buildBackfillBody_(article) {
  var summary = article.summary || {};
  var general = summary.general || null;
  var engineer = summary.engineer || null;
  var lines = [];

  lines.push("既存記事を2ボイス（非エンジニア向け / エンジニア向け）に再編集してください。");
  lines.push("元URL: " + (article.url || ""));
  lines.push("既存タイトル: " + (article.title || ""));

  if (general) {
    lines.push("--- 既存 general ---");
    lines.push(conclusionToText_(general.conclusion));
    lines.push((general.situations || []).join(" / "));
  } else if (summary.conclusion) {
    lines.push("--- 既存 conclusion ---");
    lines.push(conclusionToText_(summary.conclusion));
    lines.push((summary.situations || []).join(" / "));
  }

  if (engineer) {
    lines.push("--- 既存 engineer ---");
    lines.push(conclusionToText_(engineer.conclusion));
    lines.push((engineer.situations || []).join(" / "));
  }

  return lines.join("\n");
}

function looksEnglishTitle_(title) {
  var s = String(title || "");
  if (!s) return false;
  // 日本語（ひらがな・カタカナ・漢字）が無ければ英語見出しとみなす
  return !/[ぁ-んァ-ヶ一-龥]/.test(s);
}

function translateTitleWithGemini_(apiKey, model, source, title, conclusion) {
  var endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    model +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  var prompt =
    "次の英語タイトルを、自然な日本語のニュース見出しに翻訳してください。\n" +
    '必ず次のJSONだけを返す（説明文禁止）: {"title":"日本語見出し"}\n' +
    "- 直訳調やカタカナ多用を避け、ネイティブが読む見出しにする\n" +
    "- 固有名詞（Next.js / Claude / OpenAI 等）は残してよい\n" +
    "- 40文字以内を目安\n\n" +
    "source: " +
    source +
    "\n" +
    "title: " +
    title +
    "\n" +
    "conclusion:\n" +
    String(conclusion).slice(0, 500);

  var response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
    muteHttpExceptions: true,
  });
  var status = response.getResponseCode();
  var text = response.getContentText();
  if (status >= 300) {
    throw new Error("Gemini title translate error: " + status + " " + text);
  }
  var data = JSON.parse(text);
  var raw = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  var content = (raw[0] && raw[0].text) || "";
  content = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  var parsed = JSON.parse(content);
  var titleJa = normalizePlainText_(parsed.title);
  if (!titleJa) throw new Error("empty translated title");
  return titleJa;
}

function postIngest_(ingestUrl, ingestSecret, payload) {
  var response = UrlFetchApp.fetch(ingestUrl, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + ingestSecret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  var status = response.getResponseCode();
  if (status >= 300) {
    throw new Error(
      "ingest failed: " + status + " " + response.getContentText(),
    );
  }
}

function fetchRssItems_(feedUrl) {
  var xml = UrlFetchApp.fetch(feedUrl, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { "User-Agent": "AI-Feed-Digest/1.0" },
  });
  if (xml.getResponseCode() >= 300) {
    throw new Error(
      "RSS fetch failed: " + feedUrl + " " + xml.getResponseCode(),
    );
  }
  var doc = XmlService.parse(xml.getContentText());
  var root = doc.getRootElement();
  var atomNs = XmlService.getNamespace("http://www.w3.org/2005/Atom");
  var items = [];

  // RSS 2.0
  var channel = root.getChild("channel");
  if (channel) {
    channel.getChildren("item").forEach(function (item) {
      items.push({
        title: textOf_(item, "title"),
        link: textOf_(item, "link"),
        description: textOf_(item, "description"),
        pubDate: textOf_(item, "pubDate"),
      });
    });
    return items.filter(function (x) {
      return x.title && x.link;
    });
  }

  // Atom
  root.getChildren("entry", atomNs).forEach(function (entry) {
    var linkEl = entry.getChild("link", atomNs);
    var href = linkEl ? linkEl.getAttribute("href").getValue() : "";
    items.push({
      title: textOfNs_(entry, "title", atomNs),
      link: href,
      description:
        textOfNs_(entry, "summary", atomNs) ||
        textOfNs_(entry, "content", atomNs),
      pubDate:
        textOfNs_(entry, "updated", atomNs) ||
        textOfNs_(entry, "published", atomNs),
    });
  });

  return items.filter(function (x) {
    return x.title && x.link;
  });
}

function textOf_(el, name) {
  var child = el.getChild(name);
  return child ? child.getText().trim() : "";
}

function textOfNs_(el, name, ns) {
  var child = el.getChild(name, ns);
  return child ? child.getText().trim() : "";
}

function loadSeen_() {
  var raw = PropertiesService.getScriptProperties().getProperty("SEEN_URLS");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveSeen_(seen) {
  var keys = Object.keys(seen);
  if (keys.length > 300) {
    keys = keys.slice(keys.length - 300);
    var trimmed = {};
    keys.forEach(function (k) {
      trimmed[k] = true;
    });
    seen = trimmed;
  }
  PropertiesService.getScriptProperties().setProperty(
    "SEEN_URLS",
    JSON.stringify(seen),
  );
}
