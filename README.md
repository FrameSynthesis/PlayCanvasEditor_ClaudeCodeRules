# PlayCanvas Editor × Claude Code 設定テンプレート

PlayCanvas EditorプロジェクトでClaude Codeを活用するための設定ファイル一式です。

VSCodeのPlayCanvas拡張によるローカル同期環境での使用を想定しています。

## 概要

PlayCanvas Editorはクラウドベースの開発環境であり、ローカルファイルへの直接書き込みは同期の不具合を引き起こします。本テンプレートは、Claude CodeがEditor APIやREST APIを経由して安全にファイル操作を行えるよう、ルール・APIリファレンス・コマンドを整備したものです。

## セットアップ

### 前提条件

- Claude Code がインストール済み
- VSCode + PlayCanvas拡張でプロジェクトがローカル同期済み
- playwright-cli がインストール済み（Editor API操作に必要）

### 導入手順

1. PlayCanvas拡張で同期されたプロジェクトフォルダに CLAUDE.md と .claude/ をコピーします
1. CLAUDE.md 冒頭のプロジェクト固有セクションを編集します
1. 必要に応じて .claude/settings.json のパーミッションを調整します

```
main-scene-url: https://playcanvas.com/editor/scene/xxxxxxx
local-tmp-dir: C:\tmp
```


## 主な機能

### ファイル操作の安全性

CLAUDE.md のルールにより、Claude Codeはローカルファイルへの直接書き込み（Write, Edit等）を行わず、必ずREST APIまたはEditor API経由でファイルを操作します。

### APIリファレンス内蔵

.claude/memory/ 配下にPlayCanvas REST API・Editor APIのリファレンスを収録しています。Claude Codeはこれらを参照しながら、アセットの作成・更新・削除やスクリプトのパースなどを実行します。

### コーディング規約の自動適用

.claude/rules/ 配下の規約ファイルにより、PlayCanvasスクリプト（.js / .mjs）やシェーダーを記述する際に命名規則・属性定義・コメントスタイルが自動的に適用されます。

### Playwrightによるブラウザ操作

/open-playcanvas-editor コマンドでPlayCanvas Editorをブラウザで開き、/playwright-cli コマンドでEditor APIの実行やスナップショット取得などのブラウザ操作を行えます。

## カスタマイズ

### プロジェクト固有ルールの追加

CLAUDE.md の「プロジェクト固有の情報・ルール」セクションにプロジェクト固有の設定を記述してください。汎用ルール部分（## このファイルについて 以降）は変更せずにそのまま使用できます。

### rules の追加・変更

.claude/rules/ にMarkdownファイルを追加すると、Claude Codeが自動的に認識します。プロジェクト固有の規約がある場合はここに追加してください。