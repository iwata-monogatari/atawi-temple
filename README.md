# ATAWI temple

磐田市のお寺・寺院データベース「ATAWI temple」の初期実装です。

## 実装内容

- トップページ
- 寺院一覧
- キーワード検索、地区、宗派、状態フィルター
- 仮の個別寺院ページ
- 運営者情報
- 編集方針
- 情報提供・訂正フォームの仮ページ
- プライバシーポリシー
- 富士ヶ丘アクセス解析Worker連携
- `sitemap.xml`
- `robots.txt`

## アクセス解析

全公開ページで次のトラッカーを一度だけ読み込みます。

```html
<script
  defer
  src="https://fujigaoka-analytics-worker.hiroyukio0122.workers.dev/tracker.js"
  data-site="atawi-temple"
  data-fujigaoka-analytics="true"
></script>
```

ローカル開発時は本番集計へ送信されません。Cloudflare PagesのProduction環境には`.env.example`と同じ値を設定してください。

## 開発

```bash
npm install
npm run dev
npm run build
npm run check:analytics
```

この作業環境では、Astroのテレメトリ設定先を作れない場合があります。その場合は次のように実行します。

```bash
ASTRO_TELEMETRY_DISABLED=1 HOME=/tmp npm --cache /tmp/npm-cache run build
```

## 寺院データ

初期データは`data/temples.json`にあります。現時点のデータは本番確定前の仮登録です。寺院マスター確定後、同じ形式で正式データへ差し替えてください。

## Cloudflare Pages

公開設定は`docs/cloudflare-pages.md`にまとめています。

主な設定は次のとおりです。

```text
Build command: npm run build
Build output directory: dist
Custom domain: temple.atawi.link
```
