---
globs: "**/*.mjs"
---

# PlayCanvas mjs スクリプトのコーディング規約

## 命名規則

- ファイル名・`scriptName` は `[接頭辞]_camelCase`（例: `BH_camelCase`）。接頭辞: `BH_*` Entity挙動、`SH_*` シェーダー、`EF_*` エフェクト、`PP_*` ポストプロセス。
- 新規作成時は scriptName が `bHCamelCase` になるので、表記統一のため `BH_camelCase` に修正する。

```javascript
export class BHCamelCase extends Script {
    static scriptName = 'BH_camelCase';
}
```

## コメント

- JSDoc（`/** ... */`）を推奨。説明とタグ（`@private`、`@returns` 等）を含める。public の場合は必ず JSDoc をつける。private 関数の場合は文脈が複雑な場合（10行以上）に JSDoc を付ける。
- 関数内には原則コメントをつけない。
- `var` の使用を避ける。

## 属性定義

[PlayCanvas ESM リファレンス](https://developer.playcanvas.com/ja/user-manual/scripting/script-attributes/esm/)に従う。`static attributes` は使わず、クラスプロパティで定義する。

- **基本**: `@attribute` でEditorに公開。初期値がなければ `@type` 必須（ないと無視される）。JSDoc先頭の1文がツールチップ、`@title` で表示名。
- **型**: `number`・`string`・`boolean`・`Vec2`～`Vec4`・`Color`・`Curve`・`Asset`・`Entity`。`Vec*`／`Color`／`Curve`／`Asset`／`Entity` は `playcanvas` から import。
- **タグ**: 数値は `@range [min, max]` 等。Asset は `@resource texture` 等。文字列は `@placeholder`。条件表示は `@enabledif`／`@visibleif`。配列は `@type {T[]}` と `@size`。ゲッター/セッターはペアの直前に `@attribute` を1回。

```javascript
/**
 * 属性の説明
 * @attribute
 * @type {pc.Entity}
 */
propertyName = defaultValue;
```
