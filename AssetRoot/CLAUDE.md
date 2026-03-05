# CLAUDE.md - PlayCanvas Editor プロジェクトルール

## プロジェクト固有の情報・ルール

### プロジェクト固有ID・パス
トークン節約の為、主要なID・パスはここにキャッシュしておく。
main-scene-url: ???
local-tmp-dir: C:\tmp

### ファイル管理

- `Core`, `Plugins`, `Scripts/Integrations`, `Scripts/Utils` 階下のファイルはパッケージスクリプトのため、変更を加えない。

### 命名規則

ファイル名・スクリプト名は `[接頭辞]_camelCase`。スクリプトは基本的にmjsを用いる。
接頭辞: `BH_` Entity挙動 / `UI_` UI / `SH_` シェーダー / `EF_` エフェクト / `PP_` ポストプロセス


## このファイルについて
.claude/ 配下 および ここより下のCLAUDE.md はPlayCanvas Editor汎用の内容のみ記載する。
他プロジェクトにそのままコピーして再利用可能にすること。

## ファイル操作ルール
VSCodeのPlayCanvas拡張により同期されたローカルファイル上で運用することを想定している。
ローカルファイルシステムへの直接書き込み(mkdir, Write, Edit等)は同期の不具合を引き起こすため、全ファイル（CLAUDE.md, .claude/ 含む）で禁止。
**全てのファイル操作はEditor APIまたはREST API経由で行うこと。**

## 一時ファイルのルール
REST API PUTでアップロードする際の一時ファイル置き場は {local-tmp-dir} を使用すること。
- アップロード後は必ず一時ファイルを削除する

## 参考情報
- .claude/memory/ 配下に詳細なAPIリファレンスと操作手順あり
  - MEMORY.md: クイックリファレンス + スクリプト作成ワークフロー + 動的情報取得方法
  - playcanvas-rest-api.md: REST API全エンドポイント
  - playcanvas-editor-api.md: Editor APIクラス・メソッド詳細
- **ファイル操作の具体的なコマンド例（REST API PUT, Editor API, playwright-cli）は MEMORY.md を参照すること。**
