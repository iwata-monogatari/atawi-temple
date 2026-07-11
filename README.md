# ATAWI temple

磐田市のお寺・寺院データベース「ATAWI temple」です。

## 実装内容

- トップページ
- 寺院一覧
- 9地区別ページ
- 宗派別ページ
- 調査状況ページ
- キーワード検索、地区、宗派、状態フィルター
- 個別寺院ページ
- 運営者情報
- 編集方針
- 情報提供・訂正ページ
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
npm run validate:data
npm run check:analytics
```

この作業環境では、Astroのテレメトリ設定先を作れない場合があります。その場合は次のように実行します。

```bash
ASTRO_TELEMETRY_DISABLED=1 HOME=/tmp npm --cache /tmp/npm-cache run build
```

## 寺院データ

寺院データは`data/temples.json`にあります。静岡県知事所轄宗教法人名簿をもとに、磐田市内の寺院・宗教法人を登録しています。創建、沿革、ご本尊、写真、現地確認情報は順次追記します。

公式名簿から初期マスターを再生成する場合は、次を実行します。

```bash
node scripts/import-official-temples.mjs
```

公開URLは寺院名と地区名を組み合わせた名前ベースのslugにし、内部管理は`iwata-0001`のような番号IDで固定します。詳しくは`docs/url-policy.md`を参照してください。

地区分類は磐田物語の9地区分類を採用します。地区マスターは`data/districts.json`、運用方針は`docs/district-policy.md`を参照してください。

寺院マスター更新後は、公開前に`npm run validate:data`でID、slug、地区分類の整合性を確認します。

## Cloudflare Pages

公開設定は`docs/cloudflare-pages.md`にまとめています。

GitHub Pages用の自動デプロイは`.github/workflows/deploy.yml`で設定しています。

主な設定は次のとおりです。

```text
Build command: npm run build
Build output directory: dist
Custom domain: temple.atawi.link
```
