---
globs: "**/*.js"
---

# PlayCanvas クラシックスクリプト(.js)のコーディング規約

## 命名規則

- ファイル名・`createScript` の引数は `[接頭辞]_camelCase`（例: `BH_camelCase`）。接頭辞: `BH_*` Entity挙動、`SH_*` シェーダー、`EF_*` エフェクト、`PP_*` ポストプロセス。
- 表記統一のため、`pc.createScript` の第1引数は `'BH_camelCase'` とする。

```javascript
var BHCamelCase = pc.createScript('BH_camelCase');
```

## コメント

- JSDoc（`/** ... */`）を推奨。説明とタグ（`@private`、`@returns` 等）を含める。public の場合は必ず JSDoc をつける。private 関数の場合は文脈が複雑な場合（10行以上）に JSDoc を付ける。
- 関数内には原則コメントをつけない。
- `var` の使用を避ける。

## 属性定義

[PlayCanvas クラシックリファレンス](https://developer.playcanvas.com/ja/user-manual/scripting/script-attributes/classic/)に従う。スクリプト先頭で `attributes.add` により宣言する。

- **基本**: `Script.attributes.add('name', { type: 'number', default: 80 })`。`this.name` で参照。変更は `attr`／`attr:name` イベントで検知。
- **型**: `number`・`string`・`boolean`・`entity`・`asset`・`rgba`／`rgb`・`curve` 等。配列は `array: true`。アセットは `assetType: 'texture'` 等で種類制限。列挙は `enum: [{ 'label': value }]`。ネストは `type: 'json', schema: [...]`。

```javascript
BHCamelCase.attributes.add('speed', { type: 'number', default: 80 });
BHCamelCase.attributes.add('target', { type: 'entity' });
BHCamelCase.attributes.add('texture', { type: 'asset', assetType: 'texture' });
```
