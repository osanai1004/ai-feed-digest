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
| `GEMINI_MODEL` | No | 既定 `gemini-3.5-flash-lite`（無料枠向き）。だめなら `gemini-3.1-flash-lite` / `gemini-3.5-flash` |

4. エディタで `runOnce` を実行（初回は権限承認）
5. 毎日自動なら `createDailyTrigger` を一度実行
6. **既存記事を2ボイス化**するときは `backfillDualVoiceArticles` を実行  
   （`APP_BASE_URL` 必須。1回あたり既定12件。足りなければ再度実行で続きから進む）
7. 英語タイトル / 結論の `\n` 文字化け直しだけなら `repairExistingArticles`

### `runOnce` と `backfillDualVoiceArticles` の違い

| 関数 | 対象 | 用途 |
|---|---|---|
| `runOnce` | RSSの**新着だけ** | これから入る記事を2ボイスで取り込む |
| `backfillDualVoiceArticles` | アプリ内の**既存記事** | 過去記事を2ボイスに書き換える |

任意プロパティ:

| プロパティ | 意味 |
|---|---|
| `BACKFILL_LIMIT` | 1回の処理件数（既定 `12`） |
| `BACKFILL_CURSOR` | 進捗位置（自動更新。最初からやり直すなら `0`） |

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
| GitHub Changelog | 公式 | GitHub Changelog |
| Cloudflare | 公式 | Cloudflare Blog |
| Supabase | 公式 | Supabase Blog |
| AWS | 公式 | AWS Machine Learning Blog（AI寄り） |

- 1サイトあたり **見る件数** 最大50件（RSSの長さが上限）
- そこから AI が目玉更新だけ仕分けし、**取り込む件数** 最大2件
- 失敗したサイトはスキップして他は継続

## Slack 通知（あとから有効化）

1. Slack で通知したいチャンネルを開く
2. アプリ「Incoming Webhooks」を追加し、そのチャンネル向け URL を発行
3. GAS の `SLACK_WEBHOOK_URL` に貼る
4. 次回 `runOnce` で新着があれば通知される

未設定の間は通知だけスキップされ、取り込み自体は動きます。
