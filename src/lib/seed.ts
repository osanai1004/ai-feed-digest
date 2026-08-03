import type { Article } from "./types";

type SeedInput = {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  conclusion: string;
  situations: [string, string, string];
};

function seedArticle(input: SeedInput): Article {
  return {
    id: input.id,
    source: input.source,
    title: input.title,
    url: input.url,
    publishedAt: input.publishedAt,
    summary: {
      conclusion: input.conclusion,
      situations: [...input.situations],
    },
    createdAt: input.publishedAt,
  };
}

/** DB未接続時でも画面確認できるサンプル（ページネーション確認用に21件以上） */
export const SEED_ARTICLES: Article[] = [
  seedArticle({
    id: "seed-openai-news",
    source: "OpenAI",
    title: "（サンプル）OpenAI の製品アップデートを追うときの見方",
    url: "https://openai.com/news/",
    publishedAt: "2026-08-01T00:00:00.000Z",
    conclusion:
      "これはデモ用の要約です。本番では GAS が RSS 本文を Gemini で整形した内容が入ります。\n結論は「何が変わったか」を先に書きます。\n詳細確認は元URLで行います。",
    situations: [
      "朝の情報キャッチアップで、まず結論だけ眺めるとき",
      "業務プロンプトや社内説明に使える変化かを判断するとき",
      "チーム共有用に「使える場面」付きでメモするとき",
    ],
  }),
  seedArticle({
    id: "seed-anthropic",
    source: "Anthropic News",
    title: "（サンプル）Claude 関連の更新を実務知識に落とす",
    url: "https://www.anthropic.com/news",
    publishedAt: "2026-07-30T00:00:00.000Z",
    conclusion:
      "サンプル記事です。要約フォーマットは結論3行＋シチュエーション3点で固定します。\n読者はアプリ内だけで内容を把握できます。\n必要なら元記事URLを開きます。",
    situations: [
      "Claude の制限変更をチーム運用に反映するか検討するとき",
      "新しい使い方を社内ナレッジに短く転記するとき",
      "週次で AI ツール動向をまとめるとき",
    ],
  }),
  seedArticle({
    id: "seed-claude-blog",
    source: "Claude",
    title: "（サンプル）Claude の新機能を業務フローに載せる判断基準",
    url: "https://www.anthropic.com/claude",
    publishedAt: "2026-07-29T00:00:00.000Z",
    conclusion:
      "Claude 向けの更新を、導入可否の判断材料に変換するサンプルです。\nまず結論で変化点を把握します。\n現場適用はシチュエーション欄で想像します。",
    situations: [
      "社内チャットボットの回答品質を見直すとき",
      "長文レビューの手順を更新するとき",
      "Claude と他モデルの使い分けを決めるとき",
    ],
  }),
  seedArticle({
    id: "seed-claude-code",
    source: "Claude Code",
    title: "（サンプル）Claude Code の changelog を開発チームで拾う",
    url: "https://code.claude.com/docs/en/changelog",
    publishedAt: "2026-07-28T00:00:00.000Z",
    conclusion:
      "開発者向け更新を短く掴むサンプルです。\nCLI やエージェント挙動の変化を先に書きます。\n詳細は changelog を開いて確認します。",
    situations: [
      "ローカル開発ツールの更新可否を決めるとき",
      "エージェント実行手順をチームに共有するとき",
      "週次の開発ツール棚卸しをするとき",
    ],
  }),
  seedArticle({
    id: "seed-gemini",
    source: "Gemini",
    title: "（サンプル）Gemini 製品ブログから実務に効く差分だけ抜く",
    url: "https://blog.google/products/gemini/",
    publishedAt: "2026-07-27T00:00:00.000Z",
    conclusion:
      "Gemini の製品更新を結論ファーストで読むサンプルです。\nUI 変更と API 変更を分けて把握します。\n使える場面だけ残して共有します。",
    situations: [
      "Google Workspace 連携の変化を確認するとき",
      "社内向け Gemini 利用ガイドを更新するとき",
      "無料枠・制限変更を運用に反映するとき",
    ],
  }),
  seedArticle({
    id: "seed-google-ai",
    source: "Google AI",
    title: "（サンプル）Google AI ブログの発表を要約カードにする",
    url: "https://blog.google/technology/ai/",
    publishedAt: "2026-07-26T00:00:00.000Z",
    conclusion:
      "Google AI の広い発表を、個人リーダー向けに圧縮したサンプルです。\nまず何が新しくなったかを3行で示します。\n現場への当てはめは後段で考えます。",
    situations: [
      "研究発表と製品更新を切り分けるとき",
      "経営向けに短く報告するとき",
      "次に深掘りする記事を選ぶとき",
    ],
  }),
  seedArticle({
    id: "seed-deepmind",
    source: "Google DeepMind",
    title: "（サンプル）DeepMind の研究アップデートを実務視点で読む",
    url: "https://deepmind.google/blog/",
    publishedAt: "2026-07-25T00:00:00.000Z",
    conclusion:
      "研究系の更新を実務メモに落とすサンプルです。\nすぐ使える変化と将来ネタを分けます。\nまずは結論だけ眺めて十分です。",
    situations: [
      "中長期の技術動向をメモするとき",
      "社内勉強会のネタを探すとき",
      "製品ロードマップ比較の材料にするとき",
    ],
  }),
  seedArticle({
    id: "seed-cursor-changelog",
    source: "Cursor Changelog",
    title: "（サンプル）Cursor の更新履歴からチーム影響を拾う",
    url: "https://cursor.com/changelog",
    publishedAt: "2026-07-24T00:00:00.000Z",
    conclusion:
      "Cursor の changelog を要約したサンプルです。\nエディタ体験とエージェント機能の差分を先に書きます。\n導入判断はシチュエーションで考えます。",
    situations: [
      "エディタ設定をチームで揃えるとき",
      "エージェント機能の試験導入を検討するとき",
      "週次で IDE 更新を確認するとき",
    ],
  }),
  seedArticle({
    id: "seed-cursor-blog",
    source: "Cursor Blog",
    title: "（サンプル）Cursor Blog の解説記事を短く掴む",
    url: "https://cursor.com/blog",
    publishedAt: "2026-07-23T00:00:00.000Z",
    conclusion:
      "Cursor の解説系記事をカード化したサンプルです。\n機能紹介の要点だけ残します。\n詳細手順は元記事で確認します。",
    situations: [
      "新機能のデモ前に概要を掴むとき",
      "オンボーディング資料を作るとき",
      "チーム内で使い方を共有するとき",
    ],
  }),
  seedArticle({
    id: "seed-laravel",
    source: "Laravel",
    title: "（サンプル）Laravel Blog のフレームワーク更新を追う",
    url: "https://blog.laravel.com/",
    publishedAt: "2026-07-22T00:00:00.000Z",
    conclusion:
      "Laravel のブログ更新を要約するサンプルです。\n破壊的変更と便利機能を分けて書きます。\nアップグレード判断に使います。",
    situations: [
      "メジャーアップデート可否を検討するとき",
      "新ヘルパや構文をチームに共有するとき",
      "週次で PHP 周辺の更新を確認するとき",
    ],
  }),
  seedArticle({
    id: "seed-laravel-framework",
    source: "Laravel Framework",
    title: "（サンプル）Laravel Framework のリリースノートを短く読む",
    url: "https://github.com/laravel/framework/releases",
    publishedAt: "2026-07-21T00:00:00.000Z",
    conclusion:
      "GitHub Releases を結論付きで読むサンプルです。\n依存更新や修正内容を先に把握します。\n影響範囲の確認は元リリースへ。",
    situations: [
      "本番更新前に差分を確認するとき",
      "セキュリティ修正の有無を見るとき",
      "CI の依存更新方針を決めるとき",
    ],
  }),
  seedArticle({
    id: "seed-vercel",
    source: "Vercel",
    title: "（サンプル）Vercel のプラットフォーム更新を拾う",
    url: "https://vercel.com/blog",
    publishedAt: "2026-07-20T00:00:00.000Z",
    conclusion:
      "Vercel の発表を個人リーダー向けに圧縮したサンプルです。\nデプロイ体験や制限変更を先に書きます。\n詳細は公式記事で確認します。",
    situations: [
      "デプロイ設定を見直すとき",
      "プレビュー環境の運用を変えるとき",
      "ホスティング周りの週次確認をするとき",
    ],
  }),
  seedArticle({
    id: "seed-nextjs",
    source: "Next.js",
    title: "（サンプル）Next.js ブログから App Router の変化を掴む",
    url: "https://nextjs.org/blog",
    publishedAt: "2026-07-19T00:00:00.000Z",
    conclusion:
      "Next.js の更新を結論ファーストで読むサンプルです。\nAPI 変更と推奨パターンを分けます。\n移行判断の材料にします。",
    situations: [
      "フレームワーク更新可否を検討するとき",
      "新しいルーティング作法を確認するとき",
      "チームのコーディング規約を更新するとき",
    ],
  }),
  seedArticle({
    id: "seed-huggingface",
    source: "Hugging Face",
    title: "（サンプル）Hugging Face Blog のモデル公開を追う",
    url: "https://huggingface.co/blog",
    publishedAt: "2026-07-18T00:00:00.000Z",
    conclusion:
      "Hugging Face の更新を短く要約するサンプルです。\nモデル公開とツール更新を先に書きます。\n実験候補の選定に使います。",
    situations: [
      "新しいオープンモデルを試すとき",
      "社内検証用の候補をリストするとき",
      "研究・実装のネタを集めるとき",
    ],
  }),
  seedArticle({
    id: "seed-github",
    source: "GitHub Changelog",
    title: "（サンプル）GitHub Changelog から開発フロー影響を拾う",
    url: "https://github.blog/changelog/",
    publishedAt: "2026-07-17T00:00:00.000Z",
    conclusion:
      "GitHub の changelog をカード化したサンプルです。\nActions や PR 体験の変化を先に書きます。\nチーム運用への影響を後で考えます。",
    situations: [
      "CI/CD 設定の見直しをするとき",
      "権限やセキュリティ設定を確認するとき",
      "開発フロー改善のネタを探すとき",
    ],
  }),
  seedArticle({
    id: "seed-cloudflare",
    source: "Cloudflare",
    title: "（サンプル）Cloudflare のエッジ更新を実務向けに要約",
    url: "https://blog.cloudflare.com/",
    publishedAt: "2026-07-16T00:00:00.000Z",
    conclusion:
      "Cloudflare の発表を結論付きで読むサンプルです。\nWorkers やネットワーク周りを先に把握します。\n導入検討はシチュエーション欄で。",
    situations: [
      "エッジ処理の構成を見直すとき",
      "障害時の代替案を考えるとき",
      "インフラ系の週次キャッチアップをするとき",
    ],
  }),
  seedArticle({
    id: "seed-openai-api",
    source: "OpenAI",
    title: "（サンプル）ChatGPT / API の制限変更を運用に落とす",
    url: "https://openai.com/index/",
    publishedAt: "2026-07-15T00:00:00.000Z",
    conclusion:
      "OpenAI の制限や料金まわりを要約するサンプルです。\n運用影響が大きい点を先に書きます。\n必要なら公式ページで詳細確認します。",
    situations: [
      "社内利用ポリシーを更新するとき",
      "コスト見積もりを見直すとき",
      "利用上限のアラート設計をするとき",
    ],
  }),
  seedArticle({
    id: "seed-claude-safety",
    source: "Claude",
    title: "（サンプル）Claude の安全方針アップデートを短く読む",
    url: "https://www.anthropic.com/news/sample-safety",
    publishedAt: "2026-07-14T00:00:00.000Z",
    conclusion:
      "方針系の更新を実務メモにするサンプルです。\n禁止事項や推奨の変化を先に書きます。\nガバナンス担当への共有に使います。",
    situations: [
      "利用ガイドラインを更新するとき",
      "リスクレビュー資料を作るとき",
      "社内説明会の要点をまとめるとき",
    ],
  }),
  seedArticle({
    id: "seed-gemini-workspace",
    source: "Gemini",
    title: "（サンプル）Gemini と Workspace 連携の更新を追う",
    url: "https://blog.google/products/gemini/sample-workspace",
    publishedAt: "2026-07-13T00:00:00.000Z",
    conclusion:
      "連携機能の更新を結論ファーストで示すサンプルです。\n日常業務で効く変化を優先します。\n詳細手順は元記事へ誘導します。",
    situations: [
      "Docs / Sheets の業務改善を検討するとき",
      "社内トレーニング資料を直すとき",
      "部門展開の優先度を決めるとき",
    ],
  }),
  seedArticle({
    id: "seed-cursor-rules",
    source: "Cursor Changelog",
    title: "（サンプル）Cursor のルール機能更新をチーム運用に載せる",
    url: "https://cursor.com/changelog/sample-rules",
    publishedAt: "2026-07-12T00:00:00.000Z",
    conclusion:
      "ルール機能の差分を短く掴むサンプルです。\nプロジェクト共通設定への影響を先に書きます。\n導入は小さく試して広げます。",
    situations: [
      "リポジトリの AI ルールを整えるとき",
      "コードレビュー方針を共有するとき",
      "オンボーディング用テンプレを作るとき",
    ],
  }),
  seedArticle({
    id: "seed-laravel-octane",
    source: "Laravel",
    title: "（サンプル）Laravel 周辺ツールの更新を拾う",
    url: "https://blog.laravel.com/sample-octane",
    publishedAt: "2026-07-11T00:00:00.000Z",
    conclusion:
      "Laravel 周辺の更新を要約するサンプルです。\nパフォーマンスや運用面の変化を先に書きます。\n本番適用前のチェックリストに使います。",
    situations: [
      "パフォーマンス改善の候補を探すとき",
      "サーバ構成の見直しをするとき",
      "フレームワーク周辺の週次確認をするとき",
    ],
  }),
  seedArticle({
    id: "seed-nextjs-cache",
    source: "Next.js",
    title: "（サンプル）Next.js のキャッシュ戦略更新を実務に落とす",
    url: "https://nextjs.org/blog/sample-cache",
    publishedAt: "2026-07-10T00:00:00.000Z",
    conclusion:
      "キャッシュ関連の更新を結論付きで読むサンプルです。\n挙動変更と推奨設定を分けて書きます。\n障害調査の手がかりにも使います。",
    situations: [
      "表示遅延や古データを調査するとき",
      "キャッシュ設定を見直すとき",
      "リリース前に破壊的変更を確認するとき",
    ],
  }),
];
