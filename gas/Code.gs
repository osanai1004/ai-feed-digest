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
 *    - GEMINI_MODEL   : (任意) 既定 gemini-2.5-flash-lite
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
    source: "Hugging Face",
    url: "https://huggingface.co/blog/feed.xml",
  },
  {
    source: "GitHub Changelog",
    url: "https://github.blog/changelog/feed/",
  },
  {
    source: "Cloudflare",
    url: "https://blog.cloudflare.com/rss/",
  },
];

var GEMINI_MODEL = "gemini-2.0-flash";
var MAX_ITEMS_PER_FEED = 3;

function runOnce() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty("GOOGLE_API_KEY");
  var ingestUrl = props.getProperty("INGEST_URL");
  var ingestSecret = props.getProperty("INGEST_SECRET");
  var slackWebhook = props.getProperty("SLACK_WEBHOOK_URL");
  var appBaseUrl = props.getProperty("APP_BASE_URL");

  if (!apiKey || !ingestUrl || !ingestSecret) {
    throw new Error(
      "Script Properties に GOOGLE_API_KEY / INGEST_URL / INGEST_SECRET を設定してください",
    );
  }

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
          feed.source,
          item.title,
          bodyText,
        );

        var payload = {
          source: feed.source,
          title: item.title,
          url: item.link,
          publishedAt: item.pubDate || new Date().toISOString(),
          summary: summary,
        };

        postIngest_(ingestUrl, ingestSecret, payload);
        seen[item.link] = true;
        ingested.push(payload);
      });
    } catch (e) {
      errors.push(feed.source + ": " + e.message);
      Logger.log("feed error (" + feed.source + "): " + e.message);
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
    var conclusion = String(a.summary.conclusion || "")
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
    ":sparkles: *AI Feed Digest* に新着 " +
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

function summarizeWithGemini_(apiKey, source, title, bodyText) {
  var endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    GEMINI_MODEL +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  var prompt =
    "あなたはAIプロダクト更新を実務知識に翻訳する編集者です。\n" +
    "次の記事を日本語で要約してください。\n" +
    "必ず次のJSONだけを返してください（前後に説明文やコードフェンス禁止）。\n" +
    '{\n  "conclusion": "結論を3行程度。改行は\\\\nで区切る",\n' +
    '  "situations": ["使えるシチュエーション1", "2", "3"]\n}\n\n' +
    "要件:\n" +
    "- 結論ファーストで、何が言えるかを先に書く\n" +
    "- situations は現実の業務で使える場面を3点\n" +
    "- やや詳しめ。ただし冗長にしない\n" +
    "- 不明点は推測で埋めない\n\n" +
    "source: " +
    source +
    "\n" +
    "title: " +
    title +
    "\n" +
    "body:\n" +
    String(bodyText).slice(0, 12000);

  var response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 },
    }),
    muteHttpExceptions: true,
  });

  var status = response.getResponseCode();
  var text = response.getContentText();
  if (status >= 300) {
    throw new Error("Gemini API error: " + status + " " + text);
  }

  var data = JSON.parse(text);
  var raw =
    (((data.candidates || [])[0] || {}).content || {}).parts || [];
  var content = (raw[0] && raw[0].text) || "";
  content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

  var parsed = JSON.parse(content);
  if (!parsed.conclusion || !parsed.situations) {
    throw new Error("Gemini response missing fields: " + content);
  }
  return {
    conclusion: String(parsed.conclusion),
    situations: parsed.situations.map(String).slice(0, 3),
  };
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
    throw new Error("ingest failed: " + status + " " + response.getContentText());
  }
}

function fetchRssItems_(feedUrl) {
  var xml = UrlFetchApp.fetch(feedUrl, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { "User-Agent": "AI-Feed-Digest/1.0" },
  });
  if (xml.getResponseCode() >= 300) {
    throw new Error("RSS fetch failed: " + feedUrl + " " + xml.getResponseCode());
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
