# URL・ID設計方針

ATAWI templeでは、公開URLと内部管理IDを分けて運用します。

## 基本方針

| 用途 | 形式 | 例 |
|---|---|---|
| 公開URL | 名前ベースのslug | `/temples/senkoji-mitsuke/` |
| 内部管理ID | 番号ベース | `iwata-0001` |

公開URLは、利用者と検索エンジンに分かりやすいことを優先します。
内部管理IDは、寺院名の変更、表記揺れ、同名寺院、移転、廃寺化があっても変えない固定IDとして扱います。

## 寺院ページのslug

寺院ページのslugは、原則として次の形にします。

```text
{temple-name}-{area-name}
```

例：

```text
senkoji-mitsuke
anzenji-toyoda
ryounji-nakaizumi
```

## 同名寺院への対応

同名寺院がある場合は、地区名、旧村名、町名を足して区別します。

```text
exampleji-mitsuke
exampleji-toyoda
exampleji-fukude
```

それでも重複する場合のみ、枝番を追加します。

```text
exampleji-mitsuke-2
```

## 廃寺・寺院跡

廃寺・寺院跡も、公開URLは名前と地区を基本にします。

```text
kyu-senkoji-mitsuke
kyu-jiinato-iwata
```

廃寺の確定名称が不明な場合は、仮slugで公開せず、寺院マスター内で調査中として管理します。

## 変更ルール

- `temple_id`は原則変更しない。
- 公開後の`slug`は原則変更しない。
- やむを得ず`slug`を変更する場合は、旧URLから新URLへリダイレクトを設定する。
- 正式名称が変わっても、既に検索流入があるURLは慎重に扱う。

## データ例

```json
{
  "temple_id": "iwata-0001",
  "slug": "senkoji-mitsuke",
  "name": "宣光寺",
  "area": "見付"
}
```
