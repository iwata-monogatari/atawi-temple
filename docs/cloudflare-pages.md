# Cloudflare Pages公開メモ

ATAWI templeをCloudflare Pagesで公開する場合の設定です。

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
