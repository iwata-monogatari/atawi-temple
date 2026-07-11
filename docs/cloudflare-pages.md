# Cloudflare Pages公開メモ

ATAWI TEMPLEをCloudflare Pagesで公開する場合の設定です。

## GitHub

- Repository: `iwata-monogatari/atawi-temple`
- Branch: `main`

## Build Settings

`wrangler.toml`にもCloudflare Pages用の出力先を定義しています。

| 項目 | 値 |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 空欄 |
| Node.js version | `20` 以上 |

## Connect Git

Cloudflare Pagesで新規プロジェクトを作成し、次のGitHubリポジトリを接続します。

```text
iwata-monogatari/atawi-temple
```

Production branchは`main`にします。

## Environment Variables

Production環境に次を設定します。

```dotenv
PUBLIC_FUJIGAOKA_ANALYTICS_ORIGIN=https://fujigaoka-analytics-worker.hiroyukio0122.workers.dev
PUBLIC_FUJIGAOKA_ANALYTICS_SITE_ID=atawi-temple
PUBLIC_FUJIGAOKA_ANALYTICS_ENABLED=true
```

写真投稿を保存する場合は、Cloudflare R2に次のバケットを作成し、Pages Functionsのbindingへ追加します。

| 項目 | 値 |
|---|---|
| R2 bucket | `atawi-temple-photos` |
| Binding name | `ATAWI_PHOTO_BUCKET` |

このbindingが未設定の場合、管理画面は写真を保存しません。

## 管理者専用の写真登録

写真管理画面は `/admin/photos/` です。公開ページからはリンクしません。Cloudflare Zero Trustの
Access > ApplicationsでSelf-hosted applicationを作成し、次のパスを保護します。

```text
temple.atawi.link/admin/*
```

Allow policyには管理者本人のメールアドレス1件だけを指定します。PagesのProduction環境へ次の変数も設定します。

| 変数 | 値 |
|---|---|
| `CF_ACCESS_TEAM_DOMAIN` | `https://<team-name>.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | Access applicationのAUDタグ |
| `ATAWI_ADMIN_EMAIL` | Allow policyに指定した管理者メール |

管理画面とAPIはAccess JWTの署名、AUD、有効期限、メールアドレスを検証します。変数やAccess設定が不足した場合は、
安全のため管理画面を公開せずエラーで停止します。

### 管理キー認証（Accessを設定するまでの代替）

Cloudflare Zero Trustを設定していない期間は、Pagesのシークレットとして`ATAWI_ADMIN_KEY`を設定すると、
管理キー方式で`/admin/*`へログインできます。

```bash
printf '%s' '<長いランダム文字列>' | npx wrangler pages secret put ATAWI_ADMIN_KEY --project-name=atawi-temple
```

- 未ログインで`/admin/`配下のページを開くと管理キー入力画面が表示されます。
- 入力したキーはCookie（`Path=/admin; Secure; SameSite=Strict`、有効12時間）にのみ保存します。
- APIを直接呼ぶ場合は`X-Admin-Key`ヘッダーでも認証できます。
- `CF_ACCESS_TEAM_DOMAIN`・`CF_ACCESS_AUD`・`ATAWI_ADMIN_EMAIL`の3変数が設定されると、
  管理キー方式は無効になりCloudflare Access検証へ自動で切り替わります。切り替え後は
  `ATAWI_ADMIN_KEY`を削除して構いません。

## 寺院情報提供掲示板

公開掲示板は `/correction/`、管理者用の審査画面は `/admin/board/` です。投稿は自動公開せず、
管理者が承認した投稿だけを公開します。

Cloudflare D1で `atawi-temple-board` データベースを作成し、Pages Functionsへ次のbindingを追加します。

| 項目 | 値 |
|---|---|
| D1 database | `atawi-temple-board` |
| Binding name | `ATAWI_BOARD_DB` |

初回だけ `schema/board.sql` を実行してテーブルを作成します。

```bash
npx wrangler d1 execute atawi-temple-board --remote --file=schema/board.sql
```

迷惑投稿対策用の環境変数として、推測されにくい任意の文字列を設定します。

```dotenv
BOARD_RATE_LIMIT_SALT=<長いランダム文字列>
```

D1 bindingが未設定の場合、公開済み投稿欄は空の状態で表示され、投稿受付は停止します。

Preview環境の閲覧を本番集計へ混ぜたくない場合は、Previewだけ次にします。

```dotenv
PUBLIC_FUJIGAOKA_ANALYTICS_ENABLED=false
```

## Custom Domain

最終公開ドメインは次を想定します。

```text
temple.atawi.link
```

Cloudflare Pages側でCustom domainを追加し、DNSが自動作成されるか確認します。

## 公開後の確認

- `/`、`/temples/`、`/search/` が表示できる
- `/sitemap.xml` が表示できる
- `/robots.txt` が表示できる
- HTML内の`tracker.js`が1回だけ読み込まれている
- `data-site="atawi-temple"`になっている
- 訂正フォームの入力値がURLへ入らない
- `/correction/`で承認済み投稿のみ表示される
- `/admin/board/`がCloudflare Accessで保護されている
