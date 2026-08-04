# GAS セットアップ

1. https://script.google.com/ で新規プロジェクト
2. `Code.gs` を貼る
3. 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」に追加:

| プロパティ | 必須 | 値 |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Gemini API キー（既存キーで可） |
| `INGEST_URL` | Yes | `https://ai-feed-digest-ten.vercel.app/api/ingest`（正式URLのみ） |
| `INGEST_SECRET` | Yes | Vercel の `INGEST_SECRET` と同じ |
| `SLACK_WEBHOOK_URL` | No | Slack Incoming Webhook。未設定なら通知しない |
| `APP_BASE_URL` | No | `https://ai-feed-digest-ten.vercel.app`（Slack文言用。正式URLのみ） |
| `GEMINI_MODEL` | No | 既定 `gemini-3.5-flash-lite`（無料枠向き）。だめなら `gemini-3.1-flash-lite` / `gemini-3.5-flash` |

4. エディタで `runOnce` を実行（初回は権限承認）
5. 毎日自動なら `createDailyTrigger` を一度実行
6. 既存記事の英語タイトル / 結論の `\n` 文字化け直しは `repairExistingArticles` を一度実行  
   （`APP_BASE_URL` 必須。Gemini 呼び出しあり）

## 監視サイト（FEEDS）

| source | 種別 | 内容 |
|---|---|---|
| OpenAI | 公式 | OpenAI News |
| Claude | 準公式フィード | Claude Blog |
| Claude Code | 公式 | Claude Code changelog |
| Anthropic News | 準公式フィード | Anthropic News |
| Google DeepMind | 公式 | DeepMind Blog |
| Google AI | 公式 | Google Blog AI |
| Gemini | 公式 | Gemini 製品ブログ |
| Cursor Changelog | 公式 | Cursor 更新履歴 |
| Cursor Blog | 準公式フィード | Cursor Blog（公式RSS不安定のため） |
| Laravel | 公式 | Laravel Blog |
| Laravel Framework | 公式 | GitHub Releases |
| Vercel | 公式 | Vercel News |
| Next.js | 公式 | Next.js Blog |
| Hugging Face | 公式 | Hugging Face Blog |
| GitHub Changelog | 公式 | GitHub Changelog |
| Cloudflare | 公式 | Cloudflare Blog |

- 1サイトあたり最大3件/実行
- 失敗したサイトはスキップして他は継続

## Slack 通知（あとから有効化）

1. Slack で通知したいチャンネルを開く
2. アプリ「Incoming Webhooks」を追加し、そのチャンネル向け URL を発行
3. GAS の `SLACK_WEBHOOK_URL` に貼る
4. 次回 `runOnce` で新着があれば通知される

未設定の間は通知だけスキップされ、取り込み自体は動きます。
