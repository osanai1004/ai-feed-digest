import { formatDate } from "./formatDate";
import { getAudienceSummary } from "./summary";
import { normalizeMultilineText, toSingleLine } from "./text";
import type { Article, AudienceVoice } from "./types";

/**
 * 共有用テキストの整形。
 * 記事の公開情報（タイトル・URL・要約）のみを含め、
 * 端末内の保存状態・ウォッチ設定などの個人データは一切含めない。
 */

/** 結論など改行区切りの本文を、Slack貼り付け向けの箇条書き行に分ける */
function slackBulletLines(text: string): string[] {
  return normalizeMultilineText(text)
    .split("\n")
    .map((line) => toSingleLine(line))
    .filter(Boolean)
    .map((line) => `・${line}`);
}

export function articleToMarkdown(
  article: Article,
  voice: AudienceVoice,
): string {
  const summary = getAudienceSummary(article.summary, voice);
  const lines: string[] = [
    `## ${article.title}`,
    "",
    `- 情報源: ${article.source}（${formatDate(article.publishedAt, "long")}）`,
    `- 原文: ${article.url}`,
    "",
    "### 結論",
    "",
    summary.conclusion,
  ];

  if (summary.detail.trim()) {
    lines.push("", "### 詳細内容", "", summary.detail);
  }

  lines.push(
    "",
    "### 使えるシチュエーション",
    "",
    ...summary.situations.map((item, index) => `${index + 1}. ${item}`),
  );

  if (summary.terms.length > 0) {
    lines.push("", "### 用語ひとこと", "");
    for (const term of summary.terms) {
      lines.push(`- **${term.term}** … ${term.plain}`);
    }
  }

  return lines.join("\n");
}

/**
 * Slack貼り付け用のプレーンテキスト。
 * *太字* などの mrkdwn（Slack独自の簡易記法）は使わない。
 * 貼り付け先で記法が解釈されないと *タイトル* のように崩れ見えるため。
 */
export function articleToSlackText(
  article: Article,
  voice: AudienceVoice,
): string {
  const summary = getAudienceSummary(article.summary, voice);
  const lines: string[] = [
    `【${toSingleLine(article.title)}】`,
    `${article.source} ／ ${formatDate(article.publishedAt, "long")}`,
    "",
    "■ 結論",
    ...slackBulletLines(summary.conclusion),
  ];

  if (summary.detail.trim()) {
    lines.push("", "■ 詳細内容", ...slackBulletLines(summary.detail));
  }

  lines.push(
    "",
    "■ 使える場面",
    ...summary.situations
      .map((item) => toSingleLine(item))
      .filter(Boolean)
      .map((item) => `・${item}`),
    "",
    "■ 原文",
    article.url,
  );

  return lines.join("\n");
}
