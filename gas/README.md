# GAS セットアップ

1. https://script.google.com/ で新規プロジェクト
2. `Code.gs` を貼る
3. 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」に追加:

| プロパティ | 値 |
|---|---|
| `GOOGLE_API_KEY` | Gemini API キー（既存キーで可） |
| `INGEST_URL` | `https://あなたのアプリ.vercel.app/api/ingest` |
| `INGEST_SECRET` | Vercel の `INGEST_SECRET` と同じ |

4. エディタで `runOnce` を実行（初回は権限承認）
5. 毎日自動なら `createDailyTrigger` を一度実行
