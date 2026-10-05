# GAS セットアップ

1. https://script.google.com/ で新規プロジェクト
2. `Code.gs` を貼る
3. 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」に追加:

| プロパティ | 必須 | 値 |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Gemini API キー |
| `INGEST_URL` | Yes | `https://あなたのアプリ.vercel.app/api/ingest` |
| `INGEST_SECRET` | Yes | Vercel の `INGEST_SECRET` と同じ |
| `SLACK_WEBHOOK_URL` | No | Slack Incoming Webhook。未設定なら通知しない |
| `APP_BASE_URL` | No | `https://あなたのアプリ.vercel.app`（Slack文言用） |
| `GEMINI_MODEL` | No | 既定 `gemini-3.5-flash-lite`（無料枠向き）。だめなら `gemini-3.1-flash-lite` / `gemini-3.5-flash` |

4. エディタで `runOnce` を実行（初回は権限承認）
5. 毎日自動なら `createDailyTrigger` を一度実行
6. プロジェクトの設定でタイムゾーンを **Asia/Tokyo** にする。`atHour` はこのタイムゾーンで動く
7. X の ready を取り込むなら `createXSignalTrigger` を一度実行（毎日 **4 / 9 / 12 / 15 / 18 / 21 時**）。既存の `ingestReadyXSignals` トリガーは消してから作り直す。候補そのものは、この15分前に `workers/x-pickup` が `/api/intake` に入れる
8. **既存記事を2ボイス化／詳細内容を埋め直す**ときは `backfillDualVoiceArticles` を実行  
   （`APP_BASE_URL` 必須。1回あたり既定12件。足りなければ再度実行で続きから進む）
9. 英語タイトル / 結論の `\n` 文字化け直しだけなら `repairExistingArticles`

### 要約フィールド

各ボイス（非エンジニア向け / エンジニア向け）は次を持ちます。

| フィールド | 画面での使われ方 |
|---|---|
| `conclusion` | 「30秒で読む」と「詳しく読む」の両方に出る短い結論 |
| `detail` | 「詳しく読む」だけに出る詳細内容（背景・変更点・注意点） |
| `situations` | 使えるシチュエーション |
| `terms` | 用語ひとこと |

既存記事に `detail` が無い場合、画面では詳細内容セクションを出しません。`backfillDualVoiceArticles` で再要約すると埋まります。

### `runOnce` と `backfillDualVoiceArticles` の違い

| 関数 | 対象 | 用途 |
|---|---|---|
| `runOnce` | RSSの**新着だけ** | これから入る記事を2ボイス＋詳細内容付きで取り込む |
| `ingestReadyXSignals` | 承認済みの **X候補（ready）だけ** | 公式ページがあればそれを、無ければ投稿本文を読んで2ボイス要約し、記事にする。Xのページは取りに行かない。候補の収集は `workers/x-pickup` |
| `backfillDualVoiceArticles` | アプリ内の**既存記事** | 過去記事を2ボイス化し、詳細内容も生成し直す |

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

## X の候補（自動収集と浅子の承認）

X の API も、GAS からの X ページ取得もしません。GAS の `UrlFetch` ではログイン後の X を操作できないため、収集は [`workers/x-pickup`](../workers/x-pickup/README.md) です。GitHub Actions が、下の要約時刻の15分前にバズ順の候補を `/api/intake` へ送ります。人が同じ API で足すこともできます。

セッション（`X_STORAGE_STATE` か `X_AUTH_TOKEN` + `X_CT0`）、`INGEST_SECRET`、`APP_BASE_URL` の置き場と、止まったときの確認、秘密情報の取り替えはワーカーの README にあります。値はリポジトリに置きません。

既定では確認待ちのままです。浅子が承認して `ready` になったものだけ、このスクリプトが要約します。キーワードだけで記事にしたくないためです。無人で `ready` まで進めるときは、ワーカーの `X_PICKUP_AUTO_APPROVE=1` です。

人が手で送るときの例:

1. 候補を送る（粗い仕分けはサーバーが行う）

```bash
curl -X POST "$APP_BASE_URL/api/intake" \
  -H "Authorization: Bearer $INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "xPostUrl": "https://x.com/someone/status/123",
        "text": "投稿の本文",
        "source": "OpenAI",
        "author": "@someone",
        "impressions": 12000,
        "reposts": 80
      }
    ]
  }'
```

`impressions` と `reposts` は任意です。同じ投稿URLをあとから再送すると、公開から14日以内の既存記事は数値だけ更新されます。本文や要約は書き直しません。1回の送信は最大20件です。`Code.gs` はこの更新をしません。14日を超えた記事をその送信だけ対象にするときは、同じ JSON の先頭に `"metricsRefreshWindowDays": 17` を足します（1以上30以下）。省略すると14日のままです。

2. 確認待ちを見る: `GET /api/intake?status=pending_review`
3. 浅子が判断する: `POST /api/intake/<id>`
   - 収集時の公式URLを使う: `{"action":"approve","actor":"asako"}` → `ready`。`officialUrl` を省略すると、候補に保存してある公式URLを残す。保存が無ければ記事URLは投稿URL
   - 別の公式URLを渡す: `{"action":"approve","actor":"asako","officialUrl":"https://openai.com/..."}` → `ready`
   - 公式URLを外す: `{"action":"approve","actor":"asako","officialUrl":""}` → `ready`。記事URLは投稿URL
   - 以前のルールで `memo` に残った候補も、同じ `approve` で `ready` にできます。投稿URLがあれば公式URLは無くてよく、送ったものだけが動きます
   - 裏取りが曖昧: `{"action":"flag_factcheck","actor":"asako","note":"一次情報が見つからない"}`
4. 龍馬が曖昧なものを返す: `POST /api/intake/<id>`  
   `{"action":"resolve_factcheck","actor":"ryoma","officialUrl":"https://..."}`  
   公式URLが無くても、投稿URLがあれば `ready` になります。
5. `ingestReadyXSignals` を実行する。`ready` を2ボイス形式で `/api/ingest` に送ります。公式ページの本文が取れればそれを根拠にし、`officialNote` は「公式もこう言っている」です。公式URLが無い、または取得本文が空なら、投稿本文だけで要約し、`officialNote` は付けません。記事URLは `officialUrl || xPostUrl` です。タイトルだけの転記は送りません。毎日なら `createXSignalTrigger` を一度実行します。時刻は JST の **4, 9, 12, 15, 18, 21 時**（プロジェクトのタイムゾーンが Asia/Tokyo であること）。4時は通勤前の6時より前に載せるためです。

`Code.gs` を更新したら、Apps Script のエディタに貼り直して保存してください。貼り直すまで、デプロイ済みのスクリプトは古い規則のままです。

RSS の `runOnce` はこの流れを呼びません。
