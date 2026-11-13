import type { MetadataRoute } from "next";

/**
 * 機械に「来ないで」と伝える（行儀の良い機械だけが守る）。
 * - URL プレビューの機械は全部 OK（X・Slack などで貼った時のカード表示のため）。
 * - それ以外は全部お断り。Google 検索にも出にくくなる（承知の上）。
 * 守らない機械は src/proxy.ts で 403 にする。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "Twitterbot",
          "Slackbot",
          "Slackbot-LinkExpanding",
          "facebookexternalhit",
          "Discordbot",
          "LinkedInBot",
          "TelegramBot",
          "WhatsApp",
        ],
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  };
}
