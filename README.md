# PlayCanvas Editor × Claude Code 設定テンプレート

PlayCanvas Editor プロジェクトで Claude Code を安全に運用するためのルール・メモリ・コマンド一式です。
VSCode PlayCanvas 拡張によるローカル同期環境を前提とし、ファイル操作は全て Editor API / REST API 経由で行うルールを定めています。

## 導入手順

### 前提条件

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) がインストール済み
- VSCode + [PlayCanvas 拡張](https://marketplace.visualstudio.com/items?itemName=playcanvas.playcanvas) がセットアップ済み
- [playwright-cli](https://www.npmjs.com/package/@anthropic-ai/playwright-cli) がインストール済み

### 新規プロジェクトへのインストール

1. PlayCanvas Editor でプロジェクトを開く
2. 開発者コンソールを開く（F12 → Console タブ）
3. [install.js](https://raw.githubusercontent.com/FrameSynthesis/PlayCanvasEditor_ClaudeCodeRules/main/install.js) の内容を全てコピーしてコンソールに貼り付け、実行する
4. `[install] Done!` と表示されたら完了

これにより `CLAUDE.md` および `.claude/` 配下の全ファイルがプロジェクトに作成されます。

### インストール後の設定

各ファイルの `<!-- TEMPLATE_BOUNDARY -->` より下にプロジェクト固有の情報を追記してください：

- `CLAUDE.md`: ファイル管理ルール、命名規則など
- `.claude/commands/open-playcanvas-editor.md`: `main-scene-url`（メインシーン URL）
- `.claude/docs/file-operations.md`: `local-tmp-dir`（一時ファイル置き場のパス）

Claude Code から `/open-playcanvas-editor` コマンドでブラウザを開き、手動でログインを行うことで作業を開始出来ます。

```
例: 一定角速度で回転するCubeを実装して
```

### ルールの更新

リポジトリのテンプレートが更新された場合、Claude Code から `/update-claude-rules-from-github` コマンドで最新版に更新できます。

`<!-- TEMPLATE_BOUNDARY -->` より上のテンプレート部分のみが更新され、下のプロジェクト固有セクションは保持されます。この仕組みは `CLAUDE.md` だけでなく、TEMPLATE_BOUNDARY を含む全ファイルに適用されます。

## 注意事項

- 同名アセットが既に存在する場合、install.js はスキップし、update.js は上書きします
- フォルダ作成には Editor 内部の同期待ちが発生するため、初回インストールは数十秒かかる場合があります
- ファイルに `<!-- TEMPLATE_BOUNDARY -->` マーカーがない場合、更新コマンドはファイル全体を上書きします

## カスタマイズ

- 各ファイルの `<!-- TEMPLATE_BOUNDARY -->` より下に、プロジェクト固有のルールを自由に追加できます
- `.claude/rules/` に追加の `.md` ファイルを置くと、Claude Code が自動的に認識します
