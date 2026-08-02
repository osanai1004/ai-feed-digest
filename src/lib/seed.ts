import type { Article } from "./types";

/** DB未接続時でも画面確認できるサンプル */
export const SEED_ARTICLES: Article[] = [
  {
    id: "seed-openai-news",
    source: "OpenAI",
    title: "（サンプル）OpenAI の製品アップデートを追うときの見方",
    url: "https://openai.com/news/",
    publishedAt: "2026-08-01T00:00:00.000Z",
    summary: {
      conclusion:
        "これはデモ用の要約です。本番では GAS が RSS 本文を Gemini で整形した内容が入ります。\n結論は「何が変わったか」を先に書きます。\n詳細確認は元URLで行います。",
      situations: [
        "朝の情報キャッチアップで、まず結論だけ眺めるとき",
        "業務プロンプトや社内説明に使える変化かを判断するとき",
        "チーム共有用に「使える場面」付きでメモするとき",
      ],
    },
    createdAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "seed-anthropic",
    source: "Anthropic",
    title: "（サンプル）Claude 関連の更新を実務知識に落とす",
    url: "https://www.anthropic.com/news",
    publishedAt: "2026-07-30T00:00:00.000Z",
    summary: {
      conclusion:
        "サンプル記事です。要約フォーマットは結論3行＋シチュエーション3点で固定します。\n読者はアプリ内だけで内容を把握できます。\n必要なら元記事URLを開きます。",
      situations: [
        "Claude の制限変更をチーム運用に反映するか検討するとき",
        "新しい使い方を社内ナレッジに短く転記するとき",
        "週次で AI ツール動向をまとめるとき",
      ],
    },
    createdAt: "2026-07-30T12:00:00.000Z",
  },
];
