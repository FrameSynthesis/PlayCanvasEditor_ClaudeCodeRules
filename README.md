# PlayCanvas Editor × Claude Code 設定テンプレート

PlayCanvas EditorプロジェクトでClaude Codeを活用するための設定ファイル一式です。

VSCodeのPlayCanvas拡張によるローカル同期環境での使用を想定しています。

## 概要

PlayCanvas Editorはクラウドベースの開発環境であり、同期されたローカルファイルへの書き込みが安定しない場合があります。本テンプレートは、Claude CodeがEditor APIやREST APIを経由して安全にファイル操作を行えるよう、ルール・APIリファレンス・コマンドを整備したものです。

## 導入手順

### 前提条件
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) がインストール済み
- VSCode + [PlayCanvas拡張](https://marketplace.visualstudio.com/items?itemName=playcanvas.playcanvas) がセットアップ済み
- [playwright-cli](https://www.npmjs.com/package/playwright-cli) がインストール済み

### インストール

1. PlayCanvas Editor でプロジェクトを開く
2. 開発者コンソールを開く（F12 → Console タブ）
3. [install.js](https://raw.githubusercontent.com/FrameSynthesis/PlayCanvasEditor_ClaudeCodeRules/main/install.js) の内容を全てコピーしてコンソールに貼り付け、実行する
4. `[install] Done!` と表示されたら完了

これにより `CLAUDE.md` および `.claude/` 配下のルールファイル・メモリ・コマンドが自動的にプロジェクトに作成されます。

### インストール後の設定

`CLAUDE.md` 先頭のプロジェクト固有セクションを編集し、以下を設定してください：

- `main-scene-url`: プロジェクトのメインシーン URL
- `local-tmp-dir`: 一時ファイル置き場のパス
- その他プロジェクト固有のルール

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
