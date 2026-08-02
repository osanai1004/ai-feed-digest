# AI Feed Digest

AI 公式情報を RSS で集め、Gemini で実務向け要約し、iPhone から毎日読む個人用リーダーです。

## 構成

- **Next.js (Vercel)**: 一覧 / 詳細表示、取り込み API
- **Google Apps Script**: RSS 取得 → Gemini 要約 → Vercel へ送信
- **Neon (Postgres・任意)**: 本番の保存先（未設定時はローカル JSON / サンプル表示）

## 要約フォーマット

1. **結論**（3行程度）
2. **使えるシチュエーション**（3点）

## 1. Gemini API キー（既存キーでOK）

画面にすでにキーがある場合:

- **別のキーを必須では作り直さなくてよい**
- まずは **いま表示されているデフォルトキーをコピーして使う**
- 後からこのアプリ専用キーを切り出すのは任意（推奨だが後回しで可）

新規作成する場合:

1. [Google AI Studio API keys](https://aistudio.google.com/apikey) を開く
2. 会社 Google アカウントでログイン
3. **Create API key**
4. キーをコピー

## 2. ローカルで画面を見る

```bash
npm install
cp .env.example .env.local
# .env.local に INGEST_SECRET を入れる
npm run dev
```

開く: http://localhost:3000

## 3. Vercel へデプロイ

1. このリポジトリを Vercel に Import
2. Environment Variables:
   - `INGEST_SECRET`（長いランダム文字列）
3. （推奨）Vercel Marketplace で **Neon** を Free 接続  
   - `DATABASE_URL` が入り、本番でも記事が永続化される
4. Deploy

## 4. GAS 連携

1. [Apps Script](https://script.google.com/) で新規プロジェクト
2. `gas/Code.gs` を貼り付け
3. スクリプトプロパティ:
   - `GOOGLE_API_KEY` = Gemini API キー
   - `INGEST_URL` = `https://<your-app>.vercel.app/api/ingest`
   - `INGEST_SECRET` = Vercel と同じ値
4. `runOnce` を手動実行（初回認可あり）
5. 必要なら `createDailyTrigger` を実行

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
