# GAS セットアップ

1. https://script.google.com/ で新規プロジェクト
2. `Code.gs` を貼る
3. 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」に追加:

| プロパティ | 必須 | 値 |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Gemini API キー（既存キーで可） |
| `INGEST_URL` | Yes | `https://あなたのアプリ.vercel.app/api/ingest` |
| `INGEST_SECRET` | Yes | Vercel の `INGEST_SECRET` と同じ |
| `SLACK_WEBHOOK_URL` | No | Slack Incoming Webhook。未設定なら通知しない |
| `APP_BASE_URL` | No | `https://あなたのアプリ.vercel.app`（Slack文言用） |

4. エディタで `runOnce` を実行（初回は権限承認）
5. 毎日自動なら `createDailyTrigger` を一度実行

## 監視サイト（FEEDS）

| source | 内容 |
|---|---|
| OpenAI | OpenAI News 公式 RSS |
| Claude | Claude Blog（公開メンテフィード） |
| Claude Code | Claude Code changelog 公式 RSS |
| Google DeepMind | DeepMind Blog 公式 RSS |
| Google AI | Google Blog AI 公式 RSS |
| Gemini | Gemini 製品ブログ公式 RSS |

- 1サイトあたり最大3件/実行
- 失敗したサイトはスキップして他は継続

## Slack 通知（あとから有効化）

1. Slack で通知したいチャンネルを開く
2. アプリ「Incoming Webhooks」を追加し、そのチャンネル向け URL を発行
3. GAS の `SLACK_WEBHOOK_URL` に貼る
4. 次回 `runOnce` で新着があれば通知される

未設定の間は通知だけスキップされ、取り込み自体は動きます。
