/**
 * 機械（クローラー・AI収集）のアクセスを見分ける。
 *
 * 経緯: 正体不明の何かが昼夜10〜20分おきにサイトを開き、そのたびに Neon から
 * 記事を読み出して転送量の無料枠を食っていた（PR #19 で読み出し量は減らした）。
 * ここでは「名乗っている機械」を断る。名乗らない機械は防げない。
 *
 * 方針:
 * - URL プレビュー（X・Slack・Facebook・Discord・LinkedIn など）は通す。
 * - GAS（Google-Apps-Script）は通す。/api/articles を読むため。
 * - Vercel 自身の確認用アクセスは通す。
 * - AI 収集・検索エンジン・SEO ツール・汎用の bot/crawler/spider は断る。
 *   Google 検索に出にくくなることは承知の上。
 * - それ以外（普通のブラウザ・名乗らないもの）は通す。
 */

/** 先に照合し、合えば必ず通す（断るリストより優先） */
const ALLOW_PATTERNS: RegExp[] = [
  /Twitterbot/i,
  /Slackbot/i, // Slackbot-LinkExpanding も含む
  /Slack-ImgProxy/i,
  /facebookexternalhit/i,
  /Facebot/i,
  /Discordbot/i,
  /LinkedInBot/i,
  /TelegramBot/i,
  /WhatsApp/i,
  /Line\//, // LINE のプレビュー（"Line/" 表記）
  /Linespider-preview/i,
  /Skype/i,
  /Teams/i, // Microsoft Teams のプレビュー
  /redditbot/i,
  /Pinterestbot/i,
  /Embedly/i,
  /Iframely/i,
  /Mastodon/i,
  /Bluesky/i,
  /Google-Apps-Script/i,
  /vercel-(screenshot|favicon)/i,
];

/** 名指しで断る AI 収集・検索・SEO の機械 */
const BLOCK_PATTERNS: RegExp[] = [
  // AI の学習・検索用収集
  /GPTBot/i,
  /ChatGPT-User/i,
  /OAI-SearchBot/i,
  /ClaudeBot/i,
  /Claude-Web/i,
  /Claude-User/i,
  /Claude-SearchBot/i,
  /anthropic-ai/i,
  /PerplexityBot/i,
  /Perplexity-User/i,
  /CCBot/i,
  /Google-Extended/i,
  /GoogleOther/i,
  /Google-CloudVertexBot/i,
  /Applebot/i,
  /Bytespider/i,
  /Amazonbot/i,
  /meta-externalagent/i,
  /meta-externalfetcher/i,
  /FacebookBot/i,
  /cohere-ai/i,
  /Diffbot/i,
  /YouBot/i,
  /Timpibot/i,
  /ImagesiftBot/i,
  /omgili/i,
  /AI2Bot/i,
  /PetalBot/i,
  /DuckAssistBot/i,
  /MistralAI-User/i,
  // 検索エンジン
  /Googlebot/i,
  /Google-InspectionTool/i,
  /bingbot/i,
  /BingPreview/i,
  /YandexBot/i,
  /Baiduspider/i,
  /DuckDuckBot/i,
  /Sogou/i,
  /SeznamBot/i,
  /Yeti/i, // Naver
  // SEO ツール
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /BLEXBot/i,
  /DataForSeoBot/i,
  /serpstatbot/i,
  /barkrowler/i,
  // 汎用（最後の網）
  /bot\//i,
  /compatible;[^)]*bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /headlesschrome/i,
  /python-requests/i,
  /python-urllib/i,
  /aiohttp/i,
  /Go-http-client/i,
  /Scrapy/i,
  /\bcurl\//i,
  /\bwget\//i,
];

export type BotDecision = "allow-preview" | "block" | "allow";

/** User-Agent から通す・断るを決める */
export function classifyUserAgent(userAgent: string | null | undefined): BotDecision {
  const ua = (userAgent ?? "").trim();
  if (!ua) return "allow"; // 名乗らないものは見分けられないので通す
  if (ALLOW_PATTERNS.some((re) => re.test(ua))) return "allow-preview";
  if (BLOCK_PATTERNS.some((re) => re.test(ua))) return "block";
  return "allow";
}
