import { formatDate } from "./formatDate";
import { getAudienceSummary } from "./summary";
import { toSingleLine } from "./text";
import type { Article, AudienceVoice } from "./types";

/**
 * 共有用テキストの整形。
 * 記事の公開情報（タイトル・URL・要約）のみを含め、
 * 端末内の保存状態・ウォッチ設定などの個人データは一切含めない。
 */

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
    "",
    "### 使えるシチュエーション",
    "",
    ...summary.situations.map((item, index) => `${index + 1}. ${item}`),
  ];

  if (summary.terms.length > 0) {
    lines.push("", "### 用語ひとこと", "");
    for (const term of summary.terms) {
      lines.push(`- **${term.term}** … ${term.plain}`);
    }
  }

  return lines.join("\n");
}

export function articleToSlackText(
  article: Article,
  voice: AudienceVoice,
): string {
  const summary = getAudienceSummary(article.summary, voice);
  const lines: string[] = [
    `*${article.title}*`,
    `${article.source}（${formatDate(article.publishedAt, "long")}）`,
    "",
    toSingleLine(summary.conclusion),
    "",
    ...summary.situations.map((item) => `• ${toSingleLine(item)}`),
    "",
    `原文: ${article.url}`,
  ];
  return lines.join("\n");
}
