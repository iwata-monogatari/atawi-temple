# 9地区分類方針

ATAWI templeでは、磐田物語で採用している9地区分類を地区マスターとして利用します。

## 採用する9地区

| district_id | 地区名 | slug |
|---|---|---|
| `mitsuke` | 見付 | `mitsuke` |
| `nakaizumi` | 中泉 | `nakaizumi` |
| `mikuriya` | 御厨 | `mikuriya` |
| `toyoda` | 豊田 | `toyoda` |
| `nanbu` | 南部 | `nanbu` |
| `koyo` | 向陽 | `koyo` |
| `ryuyo` | 竜洋 | `ryuyo` |
| `fukude` | 福田 | `fukude` |
| `toyooka` | 豊岡 | `toyooka` |

## 運用ルール

- 寺院データには`district_id`を持たせる。
- 表示名は`data/districts.json`を正本とする。
- 検索・絞り込みの地区選択肢は、この9地区マスターから生成する。
- 寺院の所在地が未確定の場合は、無理に9地区へ分類せず`district_id: null`とする。
- 地区が判明した時点で、寺院マスターを更新する。

## 寺院データ例

```json
{
  "temple_id": "iwata-0001",
  "slug": "senkoji-mitsuke",
  "name": "宣光寺",
  "district_id": "mitsuke",
  "area": "見付"
}
```
