# AI更新要約

ChatGPT・Claude・Gemini などの公式アップデートを RSS で集め、日本語の「結論＋使える場面」に要約して読む個人用リーダーです。

## UI

[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) の **Clay / Framer** 系を参考にした、ポップでモダンなカードUIです。

- ソフトなグラデーション背景
- 角丸カード + ホバーで浮く
- ソース別カラーバッジ
- Space Grotesk（見出し）+ Manrope（本文）

## 構成

- **Next.js (Vercel)**: 一覧 / 詳細表示、取り込み API
- **Google Apps Script**: RSS 取得 → Gemini 要約 → Vercel へ送信
- **Neon (Postgres・任意)**: 本番の保存先（未設定時はローカル JSON / サンプル表示）

## 要約フォーマット

1. **結論**（3行程度）
2. **使えるシチュエーション**（3点）

## 1. Gemini API キー（既存キーでOK）

- すでに控えた既存キーをそのまま使う
- GAS の `GOOGLE_API_KEY` に設定

## 2. ローカルで画面を見る

```bash
npm install
cp .env.example .env.local
# .env.local に INGEST_SECRET を入れる
npm run dev
```

開く: http://localhost:3000

## 3. Vercel へデプロイ

ワンクリック Import（ブラウザで Vercel / GitHub ログイン済みの状態で開く）:

https://vercel.com/new/import?s=https://github.com/osanai1004/ai-feed-digest

1. Framework Preset: Next.js（自動検出）
2. Environment Variables:
   - `INGEST_SECRET` = 長いランダム文字列
3. Deploy
4. （あとで推奨）Marketplace で Neon Free を接続して `DATABASE_URL` を入れる

CLI 例:

```bash
npx vercel link --yes
npx vercel env add INGEST_SECRET production
npx vercel --prod --yes
```

## 4. GAS 連携

詳細は `gas/README.md`。

1. [Apps Script](https://script.google.com/) で新規プロジェクト
2. `gas/Code.gs` を貼り付け
3. スクリプトプロパティ:
   - `GOOGLE_API_KEY` = Gemini API キー
   - `INGEST_URL` = `https://<your-app>.vercel.app/api/ingest`
   - `INGEST_SECRET` = Vercel と同じ値
   - `SLACK_WEBHOOK_URL` = （任意）Slack Incoming Webhook
   - `APP_BASE_URL` = （任意）アプリURL
4. `runOnce` を手動実行（初回認可あり）
5. 必要なら `createDailyTrigger` を実行

監視対象（初期設定）: OpenAI / Claude / Claude Code / Anthropic News / Google DeepMind / Google AI / Gemini / Cursor / Laravel / Vercel / Next.js / Hugging Face / GitHub Changelog / Cloudflare  
詳細は `gas/README.md`。Slack 通知は Webhook 未設定ならスキップ（後から有効化可）。

## API

### `POST /api/ingest`

```http
Authorization: Bearer <INGEST_SECRET>
Content-Type: application/json
```

```json
{
  "source": "OpenAI",
  "title": "記事タイトル",
  "url": "https://example.com/post",
  "publishedAt": "2026-08-02T00:00:00.000Z",
  "summary": {
    "conclusion": "結論1行目\\n2行目\\n3行目",
    "situations": ["場面1", "場面2", "場面3"]
  }
}
```

### `GET /api/articles`

保存済み記事一覧。

## iPhone での見方

1. Safari で Vercel URL を開く
2. 共有 → **ホーム画面に追加**
3. 一覧タップ → 要約確認 → 必要なら「元記事で詳細を確認する」
