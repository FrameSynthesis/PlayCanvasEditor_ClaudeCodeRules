---
globs: "**/SH_*.mjs"
---

# PlayCanvas ShaderChunk を用いたシェーダー記述

**既存の SH_* スクリプト（例: SH_avatarClothes.mjs, SH_avatarFace.mjs）を確認すればすぐ分かることは記載しない。本ルールは概念・約束・非自明な仕様に絞る。**

## 主な ShaderChunk の役割

ShaderChunk 一覧は [PlayCanvas Engine リポジトリ](https://github.com/playcanvas/engine/blob/main/src/scene/shader-lib/glsl/collections/shader-chunks-glsl.js) で確認できる。

| チャンク名 | 役割 |
|-----------|------|
| `litUserDeclarationPS` | `#define`、`uniform` 宣言、GLSL 関数定義（他モジュールの GLSL を連結可） |
| `litUserMainStartPS` | フラグメント main 冒頭（テクスチャサンプル・中間変数への格納） |
| `diffusePS` | `getAlbedo()`。発光のみなら `dAlbedo = vec3(0.0)` |
| `emissivePS` | `getEmission()` で最終的な `dEmission` を計算 |
| `lightDiffuseLambertPS` | 標準ライティングを無効化する場合は `getLightDiffuse(...) { return 0.0; }` |

## シェーダー変数命名（接頭辞 d / u / g）

| 接頭辞 | 意味 |
|--------|------|
| **u** | このマテリアル／スクリプトで `setParameter` する uniform |
| **g** | シーン共通の uniform（シーン・ライティング等）。SH_* では set しない |
| **d** | シェーダー内のデータ。エンジン built-in（`dAlbedo`, `dEmission`, `dNormalW`） |

## shaderChunksVersion

ShaderChunk の **API バージョン**指定。カスタムチャンクを使う場合は、サポートするエンジンの major.minor を文字列で設定（例: エンジン v2.8.1 なら `'2.8'`）。将来エンジンがそのバージョンを非対応にした場合は警告が出るため、チャンクを新形式に合わせてこの値を最新に更新する。
