# ATAWI TEMPLE

磐田市のお寺・寺院データベース「ATAWI TEMPLE」です。

## 実装内容

- トップページ
- 寺院一覧
- 9地区別ページ
- 宗派別ページ
- 調査状況ページ
- Googleマップ導線、地図ページ
- キーワード検索、地区、宗派、状態フィルター
- 個別寺院ページ
- 運営者情報
- 編集方針
- 情報提供・訂正ページ
- プライバシーポリシー
- 富士ヶ丘アクセス解析Worker連携
- ブログ（`/blog/`・大石浩之の署名記事）と `feed.xml`
- `sitemap.xml`
- `robots.txt`

## ブログ（/blog/）

寺院データベース本体とは別に、大石浩之名義の署名ブログを `/blog/` で公開します。
毎日の運用は「ブログ司令塔」（`work_claude\blog-autopilot`）から半自動で行い、
書きぶりは `blog-autopilot\rules\EDITORIAL-CHARTER.md`（編集憲章）が最上位規約です。

```
data/blog-posts.json      台帳（メタ情報のみ。本文は入れない）
data/blog/<slug>.html     本文のHTML断片（h2から始める。h1・FAQ・出典・著者欄はテンプレート側）
src/lib/blog.ts           台帳と本文の読み込み
src/pages/blog/           一覧・個別ページ
src/pages/feed.xml.ts     RSS（直近50本）
scripts/validate-blog.mjs 検査（npm run validate:blog / npm run check に同梱）
```

- URLは `/blog/YYYYMMDD-kebab-slug/` で固定し、公開後は変更しません。
- `slug` の日付と `published` は必ず一致させます（サイトマップ・RSSの日付がずれるため）。
- 構造化データは BlogPosting / Person / BreadcrumbList / FAQPage の4種をテンプレートが自動で出します。
- 記事の追加・修正後は `npm run check` を通してから push します。

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
npm run verify:temple-data
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

## Googleマップ

詳細ページはGoogle Mapsの埋め込み地図を表示します。`PUBLIC_GOOGLE_MAPS_BROWSER_KEY`が設定されている場合はMaps Embed APIを使い、未設定時もGoogle Mapsの埋め込み表示と「Googleマップで開く」リンクを表示します。

全体地図ページは`/map/`です。APIキーや座標が未設定でも磐田市の広域Google Mapsを表示します。`data/temples.json`に`lat`/`lng`が登録され、`PUBLIC_GOOGLE_MAPS_BROWSER_KEY`が設定されると、Maps JavaScript APIとAdvanced Markersで地区カラーのピンを表示します。Advanced Markers用に`PUBLIC_GOOGLE_MAPS_MAP_ID`も設定してください。

Maps JavaScript APIは課金対象になり得るため、`/api/maps-quota`で月間安全上限を確認してから読み込みます。`GOOGLE_MAPS_DYNAMIC_MONTHLY_CAP`を`9000`など無料枠より低い値に設定し、上限到達時はピン付き地図を読み込まず、無料の広域埋め込み地図とGoogleマップリンクだけを表示します。緊急停止する場合は`GOOGLE_MAPS_DYNAMIC_DISABLED=true`にします。

一括ジオコーディングは次の流れです。初回は必ずドライランで結果を確認してください。

```bash
GOOGLE_MAPS_GEOCODING_KEY=... npm run geocode:temples -- --limit=5
GOOGLE_MAPS_GEOCODING_KEY=... npm run geocode:temples -- --write
npm run validate:data
```

公開用のブラウザキーは、Google Cloud側で`https://temple.atawi.link/*`などのHTTPリファラ制限と、Maps Embed API / Maps JavaScript APIのAPI制限を設定してください。ジオコーディング用キーは公開環境に置かず、ローカル実行だけに使います。

## Cloudflare Pages

公開設定は`docs/cloudflare-pages.md`にまとめています。

GitHub Pages用の自動デプロイは`.github/workflows/deploy.yml`で設定し、`gh-pages`ブランチへ公開用ファイルを出力します。

主な設定は次のとおりです。

```text
Build command: npm run build
Build output directory: dist
Custom domain: temple.atawi.link
```
