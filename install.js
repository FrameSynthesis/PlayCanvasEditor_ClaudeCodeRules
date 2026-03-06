/**
 * PlayCanvas Editor Console Script
 * GitHub リポジトリから CLAUDE.md / .claude/ 配下のルールファイルを
 * 現在のプロジェクトにコピーする。
 *
 * 使い方: PlayCanvas Editor の開発者コンソール (F12) にコピペして実行
 */
(async () => {
    const REPO = 'FrameSynthesis/PlayCanvasEditor_ClaudeCodeRules';
    const BRANCH = 'main';
    const ROOT = 'AssetRoot';

    const projectId = config.project.id;
    const branchId = config.self.branch.id;
    const token = config.accessToken;
    const apiBase = 'https://playcanvas.com/api';

    console.log(`[install] Project: ${projectId}, Branch: ${branchId}`);

    // --- ユーティリティ ---
    const delay = ms => new Promise(r => setTimeout(r, ms));

    async function apiPost(path, formData) {
        const resp = await fetch(`${apiBase}${path}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!resp.ok) throw new Error(`POST ${path}: ${resp.status} ${await resp.text()}`);
        return resp.json();
    }

    function rel(fullPath) {
        return fullPath.slice(ROOT.length + 1);
    }

    // --- GitHub Tree 取得 ---
    console.log('[install] Fetching GitHub tree...');
    const treeResp = await fetch(
        `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`
    );
    if (!treeResp.ok) {
        console.error('[install] GitHub API error:', await treeResp.text());
        return;
    }
    const treeData = await treeResp.json();
    const items = treeData.tree.filter(t => t.path.startsWith(ROOT + '/'));
    const folders = items
        .filter(t => t.type === 'tree')
        .sort((a, b) => a.path.split('/').length - b.path.split('/').length);
    const files = items.filter(t => t.type === 'blob');

    console.log(`[install] GitHub: ${folders.length} folders, ${files.length} files`);

    // --- フォルダ作成（階層ごとにまとめて作成 → 待機） ---
    const folderIds = {}; // relPath -> assetId

    // 階層(depth)ごとにグループ化
    const foldersByDepth = {};
    for (const f of folders) {
        const r = rel(f.path);
        const depth = r.split('/').length;
        (foldersByDepth[depth] = foldersByDepth[depth] || []).push(f);
    }

    for (const depth of Object.keys(foldersByDepth).sort((a, b) => a - b)) {
        const group = foldersByDepth[depth];
        const toCreate = [];

        for (const f of group) {
            const r = rel(f.path);
            const parts = r.split('/');
            const name = parts[parts.length - 1];
            const parentRel = parts.slice(0, -1).join('/');
            const parentId = parentRel ? folderIds[parentRel] : null;

            // 既存チェック
            const existing = editor.assets.list().find(a =>
                a.get('name') === name &&
                a.get('type') === 'folder' &&
                String(a.get('parent') || '') === String(parentId || '')
            );
            if (existing) {
                folderIds[r] = existing.get('id');
                console.log(`[install] = folder: ${r} (id=${existing.get('id')})`);
                continue;
            }

            // Editor API でフォルダ作成
            const parentAsset = parentId ? editor.assets.get(parentId) : null;
            const opts = { name };
            if (parentAsset) opts.folder = parentAsset;
            editor.assets.createFolder(opts);
            toCreate.push({ r, name, parentId });
            console.log(`[install] creating folder: ${r}...`);
        }

        if (toCreate.length === 0) continue;

        // この階層の全フォルダが同期されるのを待つ
        await delay(3000);

        for (const { r, name, parentId } of toCreate) {
            // parentId の有無に関わらず、名前とタイプで探す（parent が null の場合も許容）
            const created = await new Promise((resolve, reject) => {
                const start = Date.now();
                const check = () => {
                    // まず正しい parent で探す
                    let found = editor.assets.list().find(a =>
                        a.get('name') === name &&
                        a.get('type') === 'folder' &&
                        String(a.get('parent') || '') === String(parentId || '')
                    );
                    // なければ root (parent=null) で探す（createFolder が parent を無視した場合）
                    if (!found) {
                        found = editor.assets.list().find(a =>
                            a.get('name') === name &&
                            a.get('type') === 'folder' &&
                            a.get('parent') == null
                        );
                    }
                    if (found) return resolve(found);
                    if (Date.now() - start > 30000) return reject(new Error(`Timeout: folder ${r}`));
                    setTimeout(check, 300);
                };
                check();
            });

            folderIds[r] = created.get('id');
            console.log(`[install] + folder: ${r} (id=${created.get('id')}, parent=${created.get('parent')})`);
        }
    }

    // --- ファイル作成 (REST API POST) ---
    console.log('[install] Creating files...');
    for (const f of files) {
        const r = rel(f.path);
        const parts = r.split('/');
        const fileName = parts[parts.length - 1];
        const parentRel = parts.slice(0, -1).join('/');
        const parentId = parentRel ? folderIds[parentRel] : null;

        // アセット名とblob ファイル名を決定
        // .md.txt → name: 'CLAUDE.md', blob: 'CLAUDE.md.txt' (text型 + 正しいローカル名)
        // .json   → name: 'settings.json', blob: 'settings.json' (json型)
        let assetName = fileName;
        let blobName = fileName;
        if (/\.\w+\.txt$/.test(fileName)) {
            assetName = fileName.slice(0, -4); // .md.txt → .md
            blobName = fileName;               // .md.txt のまま (.txt末尾 → text型)
        }

        // 既存チェック（name が .md.txt と .md のどちらで作られていても検出）
        const existing = editor.assets.list().find(a =>
            (a.get('name') === assetName || a.get('name') === fileName) &&
            String(a.get('parent') || '') === String(parentId || '')
        );
        if (existing) {
            console.log(`[install] = file: ${r} (id=${existing.get('id')})`);
            continue;
        }

        // GitHub raw content
        const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${f.path}`;
        const resp = await fetch(rawUrl);
        if (!resp.ok) {
            console.error(`[install] x fetch failed: ${r}`);
            continue;
        }
        const content = await resp.text();

        // REST API POST でアセット作成
        const mime = fileName.endsWith('.json') ? 'application/json' : 'text/plain';
        const formData = new FormData();
        formData.append('name', assetName);
        formData.append('projectId', projectId);
        formData.append('branchId', branchId);
        if (parentId != null) formData.append('parent', parentId);
        formData.append('preload', 'true');
        formData.append('file', new Blob([content], { type: mime }), blobName);

        try {
            const created = await apiPost('/assets', formData);
            console.log(`[install] + file: ${r} (id=${created.id}, parent=${created.parent})`);
        } catch (e) {
            console.error(`[install] x failed: ${r}`, e.message);
        }
    }

    console.log('[install] Done!');
})();
