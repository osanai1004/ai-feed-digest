# X 候補の自動収集

浅子がブラウザで投稿をコピーしなくても、監視している製品のバズ投稿が `/api/intake` に入るようにする作業です。X の API は使いません。ログインした Chromium（Playwright）で Top 検索を開き、表示回数・リポスト・いいねが高い順に最大20件を選びます。

GAS（Google Apps Script）の `UrlFetch` では X のログイン画面と JavaScript のタイムラインを操作できないため、収集はここ（Node）で行います。要約は今までどおり GAS の `ingestReadyXSignals` です。

## 流れ

1. このワーカーが X に保存済みセッションでログインする
2. 監視製品の Top 検索から投稿を読む（足りないときだけ最新も足す）
3. 本文が短い、製品名が無い、返信、広告、古い投稿は捨てる。規則はアプリの `coarseFilterText` と同じ
4. 出典 URL は、投稿内の公式ページ（OpenAI や Anthropic など）。無ければ投稿 URL のまま。`t.co` はリダイレクト先を見る
5. `POST /api/intake` に `title` / `text`（本文）/ `author` / `xPostUrl` / あれば `officialUrl` と数値を送る
6. サーバーは確認待ち（`pending_review`）にする。浅子が承認すると `ready` になり、GAS が要約する

一覧と GAS は作成が新しい順です。ワーカーはバズの低い投稿から送り、一番バズっている投稿が確認待ちの先頭に来るようにします。

## 承認を残す理由

既定では自動承認しません。製品名が入っているだけでは、広告まがいの投稿や噂が記事になるのを止められないためです。浅子の承認（`pending_review` → `ready`）は今までどおりです。

全自動にするときは `X_PICKUP_AUTO_APPROVE=1` です。その実行で新規に確認待ちになった候補だけを `ready` にします。既に判断済みの行や、キーワード不一致で `filtered` になった行は動かしません。オンにすると、次の GAS 実行で公開フィードへ載ります。候補の中身をドライランで見てからにしてください。

スケジュール実行で常時オンにするには、GitHub の Repository variable `X_PICKUP_AUTO_APPROVE` を `1` にします。手動実行のチェックは、その1回だけです。

## いつ動くか

GitHub Actions の cron は UTC です。GAS の `createXSignalTrigger`（JST の 4 / 9 / 12 / 15 / 18 / 21 時）の15分前です。

| JST | UTC cron |
|---|---|
| 3:45 | 18:45（前日） |
| 8:45 | 23:45（前日） |
| 11:45 | 2:45 |
| 14:45 | 5:45 |
| 17:45 | 8:45 |
| 20:45 | 11:45 |

ワークフローの cron は `45 2,5,8,11,18,23 * * *` です。GitHub のスケジュールは default branch（`main`）にマージされたあとだけ動きます。遅れることがあります。承認がオフのあいだは、同じ回の GAS には間に合わなくても、次の確認と次の要約で載ります。

X は GitHub が用意する Ubuntu ランナーからのアクセスを HTTP 403（中身が空）で止めることがあります。そのときは Repository variable `X_PICKUP_RUNNER` に、`https://x.com` を開ける self-hosted runner のラベル（例: `self-hosted`）を入れます。未設定なら `ubuntu-latest` です。403 のジョブは失敗で終わり、候補ゼロの成功にはしません。

self-hosted runner を置かない場合は、X を開けるマシンの cron（タイムゾーン Asia/Tokyo）でも同じコマンドを走らせられます。

```cron
45 3,8,11,14,17,20 * * * cd /path/to/ai-feed-digest/workers/x-pickup && /usr/bin/npm run pickup >> /var/log/x-pickup.log 2>&1
```

環境変数は `APP_BASE_URL`、`INGEST_SECRET`、`X_STORAGE_STATE_PATH` をそのユーザーの環境に置きます。時刻は GAS の 15 分前（JST 3:45 / 8:45 / 11:45 / 14:45 / 17:45 / 20:45）です。

## 必要な秘密情報

リポジトリには置きません。GitHub の Settings → Secrets and variables → Actions に入れます。

| 名前 | 必須 | 内容 |
|---|---|---|
| `INGEST_SECRET` | 送るとき | Vercel と GAS と同じ秘密文字列 |
| `APP_BASE_URL` | 送るとき | `https://yoyaku-wakaru.vercel.app`（末尾スラッシュなし）。変数（Variables）でもよい |
| `BASE_URL` | 別名 | `APP_BASE_URL` が空のときだけ使う |
| `X_STORAGE_STATE` | セッションのどれか | `npm run login` が書いた JSON の中身。こちらを推奨 |
| `X_AUTH_TOKEN` と `X_CT0` | セッションのどれか | ブラウザの Cookie。二つセット。`X_STORAGE_STATE` が無いとき |

`X_USERNAME` と `X_PASSWORD` は、手元のログイン補助だけです。GitHub には置かないでください。二段階認証は画面で済ませます。

ドライラン（`X_PICKUP_DRY_RUN=1`）は投稿せず、秘密文字列も要りません。X から取るときだけセッションが要ります。

## セッションの取り方

手元の画面があるマシンで一度だけ行います。

```bash
cd workers/x-pickup
npm ci
npx playwright install chromium
npm run login
```

Chromium が開きます。X にログインし、ホームが見えたらターミナルで Enter を押します。`workers/x-pickup/secrets/x-storage-state.json` ができます（権限 600）。このファイルは `.gitignore` 済みです。

中身を GitHub secret `X_STORAGE_STATE` に貼ります。貼ったあとに共有マシンへファイルを残さないでください。

Cookie で渡す場合は、ブラウザの開発者ツールで `x.com` の `auth_token` と `ct0` をコピーし、同名の secret にします。

## ローカルでの確認

アプリ側の依存関係はリポジトリ直下で `npm install` します。収集側は `workers/x-pickup` で `npm ci` します。

### 1. パーサだけ（X にも本番にも繋がない）

```bash
cd workers/x-pickup
X_PICKUP_DRY_RUN=1 X_PICKUP_FIXTURE_FILE=fixture/tweets.html npm run pickup
```

標準出力の JSON に、OpenAI の投稿が1件、`officialUrl` 付きで出ます。ランチの投稿と返信は落ちます。

### 2. ローカルの `/api/intake` に入れる

本番の `DATABASE_URL` は使いません。別ターミナルで、リポジトリ直下:

```bash
INGEST_SECRET=local-dev npm run dev
```

```bash
cd workers/x-pickup
X_PICKUP_DRY_RUN=0 \
APP_BASE_URL=http://127.0.0.1:3000 \
INGEST_SECRET=local-dev \
X_PICKUP_FIXTURE_FILE=fixture/tweets.html \
npm run pickup
```

```bash
curl -s -H "Authorization: Bearer local-dev" \
  "http://127.0.0.1:3000/api/intake?status=pending_review"
```

`signals` に投稿 URL `https://x.com/OpenAI/status/111` が増えていれば、人が X を開かなくても候補は入っています。`officialUrl` は `https://openai.com/index/new-model` です。承認時に `officialUrl` を省略すると、この値のまま `ready` になります。外すときは `"officialUrl": ""` を明示します。

### 3. 本物の X

```bash
cd workers/x-pickup
X_PICKUP_DRY_RUN=1 X_STORAGE_STATE_PATH=secrets/x-storage-state.json npm run pickup
```

中身を見てから、`X_PICKUP_DRY_RUN=0` と `APP_BASE_URL` と `INGEST_SECRET` を足して送ります。ステージング先が別なら `APP_BASE_URL` をその URL にします。

GitHub では Actions の「X candidate pickup」を手動実行します。`dry_run` は既定でオンです。外すと `/api/intake` に送ります。スケジュールはマージ後の `main` だけです。

## 止まったとき

1. Actions の「X candidate pickup」が赤いか。ログの最後の JSON と `collected=` を見る
2. ログに `X returned HTTP 403`（または 429）: そのランナーの IP を X が止めている。`X_PICKUP_RUNNER` を self-hosted にするか、上の cron を X が開けるマシンで動かす
3. 終了コード 2 で login wall: セッション期限切れ。`npm run login` で取り直し、`X_STORAGE_STATE` を差し替える
4. `Unauthorized`: `INGEST_SECRET` が Vercel と違う
5. `APP_BASE_URL (or BASE_URL) and INGEST_SECRET are required`: 手動実行で dry_run を外したのに URL か秘密文字列が無い
6. `selected=0`: 検索はできたが、製品名・長さ・新しさで全部落ちた。ドライランの `dropped` を見る。X の画面変更でカードが読めていないときは `collected=0`
7. 確認待ちだけ増えて記事にならない: 承認がオフ。浅子が `POST /api/intake/:id` の `approve` をするか、`X_PICKUP_AUTO_APPROVE` を検討する
8. `ready` のまま記事にならない: GAS。タイムゾーンが Asia/Tokyo か、`createXSignalTrigger` を作り直したか、実行ログの `x ingested=` を見る
9. スケジュールが一度も走らない: ワークフローが `main` に無い。マージする

## 秘密情報のローテーション

### `INGEST_SECRET`

1. `openssl rand -base64 32` で新しい値を作る
2. Vercel の `INGEST_SECRET` を更新して再デプロイする
3. GAS のスクリプトプロパティ `INGEST_SECRET` を同じ値にする
4. GitHub Actions の secret `INGEST_SECRET` を同じ値にする

Vercel を変えた時点で古い値は拒否されます。GAS と GitHub は続けて更新します。

### X のセッション

1. `npm run login` で新しい `x-storage-state.json` を作る
2. GitHub secret `X_STORAGE_STATE` を中身で置き換える
3. Cookie 方式なら `X_AUTH_TOKEN` と `X_CT0` をセットで置き換える。`ct0` だけ古いままにしない
4. パスワードを変えたとき、二段階認証を変えたときも、セッションを取り直す
5. 古い JSON は手元から消す。ログや PR に貼らない

セッションは数週間で切れることがあります。ログイン壁で失敗したら、上記をやり直します。
