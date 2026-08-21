# data/blog/

大石浩之の署名ブログ（`/blog/`）の**本文だけ**を置くフォルダ。

- ファイル名は `data/blog-posts.json` の `slug` と完全一致させる（`YYYYMMDD-kebab-slug.html`）。
- 中身は `<h2>` から始まる HTML の断片。`<html>` `<body>` `<h1>` は書かない
  （`h1`・結論ブロック・FAQ・出典・著者ボックスはテンプレート側が組み立てる）。
- 使えるタグ：`h2` `h3` `p` `ul` `ol` `li` `strong` `em` `a` `table` `thead` `tbody` `tr` `th` `td`
  `blockquote` `figure` `img` `figcaption`。`script` `style` `iframe` は検査で落ちる。
- 台帳と本文の対応、日付、FAQ3問、出典、禁止語は `npm run validate:blog` が検査する。
