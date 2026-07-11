# 2026-07-11 Deep Research 調査データ（作業用アーカイブ）

寺院ページ増補のための調査成果。**wave1のみ data/temples.json へマージ・公開済み**。wave2以降は未マージ。

## 状態

| フォルダ | 内容 | マージ状況 |
|---|---|---|
| wave1-results | 第1弾: 117寺の一般Web調査（12バッチ） | **マージ済み**（コミット ecfa75e） |
| wave2-results | 第2弾: 薄い73寺の深掘り（磐田郡誌NDL全文・遺跡総覧等、deep-01〜10）＋霊場札所マスター（pilgrimage-map.json） | 未マージ |
| wave3-results | 第3弾: 宗派公式サイト横断（soto-1/soto-3/myoshinji/hokoji-jishu/jodo-shinshu/nichiren-shingon の6ファイル。**soto-2は中断につき欠落**） | 未マージ |
| wave4-results | 第4弾: 文化財オープンデータ照合（opendata.json）＋国県市文化財DB横断（heritage-db.json）。**文化財だより・発掘報告・法人名簿照合は中断につき欠落** | 未マージ |

## 再開時のマージ手順（想定）

1. マージ順: wave2（既存sections統合置換）→ pilgrimage-map（pilgrimage_note置換）→ wave3（空欄補完＋出典追加）→ wave4（cultural_assets_add追記＋出典追加）
2. マージ時の個別修正事項:
   - **慈恩寺（jionji-mitsuke）**: 「遠州三十三観音第19番」は誤り（19番は正醫寺）。正しくは遠江四十九薬師第49番（結願）。history_summary/sections内の言及も要修正
   - 金台寺（kindaiji-tenryu）: 時宗公式の読みは「こんたいじ」（name_kana修正候補）
   - 臨黄ネットの読み齟齬4件（虫生寺ちゅうしょうじ・永明寺ようめいじ・龍雲庵りょううんあん・寳珠寺ほうしゅうじ）は要判断
   - 明王寺（myooji-mitsuke）: 臨黄ネット住所が見性寺と同一（兼務登録の可能性）
   - 地区分類の再検証: 寿正寺（蛭池）・蔵本寺（五十子）・龍法院（大原）は旧福田町域の可能性
3. 文体規則: 「今回の調査」等の自己言及禁止（wave1では22件を修正した実績あり）。出典採用基準は docs/source-policy.md に従う
4. マージスクリプトの雛形: merge-results.mjs（wave1で使用。wave2以降は置換/補完/追記のモード分けが必要）

## 出典ポリシー

docs/source-policy.md（S1〜B・発見専用の信頼ランク）を参照。Wikipedia・参拝サイト根拠の既存叙述は上位出典へ降格差し替えを進める（未完）。
