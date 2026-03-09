/**
 * PlayCanvas Editor Console Script
 * GitHub リポジトリから CLAUDE.md / .claude/ 配下のルールファイルを最新版に更新する。
 * TEMPLATE_BOUNDARY を含むファイルは、境界より上（テンプレート部分）のみ更新し、
 * 境界より下（プロジェクト固有部分）を保持する。
 *
 * 使い方: PlayCanvas Editor の開発者コンソール (F12) にコピペして実行
 */
(async () => {
    const REPO = 'FrameSynthesis/PlayCanvasEditor_ClaudeCodeRules';
    const BRANCH = 'main';
    const ROOT = 'AssetRoot';
    const MARKER = '<!-- TEMPLATE_BOUNDARY -->';

    const projectId = config.project.id;
    const branchId = config.self.branch.id;
    const token = config.accessToken;
    const apiBase = 'https://playcanvas.com/api';

    console.log(`[update] Project: ${projectId}, Branch: ${branchId}`);

    // --- ユーティリティ ---
    const delay = ms => new Promise(r => setTimeout(r, ms));

    async function apiGet(path) {
        const resp = await fetch(`${apiBase}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error(`GET ${path}: ${resp.status}`);
        return resp;
    }

    async function apiPut(assetId, blob, filename) {
        const formData = new FormData();
        formData.append('branchId', branchId);
        formData.append('file', blob, filename);
        const resp = await fetch(`${apiBase}/assets/${assetId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!resp.ok) throw new Error(`PUT /assets/${assetId}: ${resp.status} ${await resp.text()}`);
        return resp.json();
    }

    async function apiPost(formData) {
        const resp = await fetch(`${apiBase}/assets`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        if (!resp.ok) throw new Error(`POST /assets: ${resp.status} ${await resp.text()}`);
        return resp.json();
    }

    function rel(fullPath) {
        return fullPath.slice(ROOT.length + 1);
    }

    // pathプロパティ（祖先フォルダIDの配列）の末尾要素でparentを判定する
    // path=[] → ルート, path=[A] → Aの子, path=[A,B] → Bの子
    function getParentFromPath(asset) {
        const p = asset.get('path') || [];
        return p.length > 0 ? p[p.length - 1] : null;
    }

    // 重複フォルダがある場合、子アセットを持つものを優先して返す
    function findBestFolder(name, parentId) {
        const candidates = editor.assets.list().filter(a =>
            a.get('name') === name &&
            a.get('type') === 'folder' &&
            getParentFromPath(a) === parentId
        );
        if (candidates.length <= 1) return candidates[0] || null;
        for (const c of candidates) {
            const cid = c.get('id');
            const hasChildren = editor.assets.list().some(a => {
                const p = a.get('path') || [];
                return p.includes(cid);
            });
            if (hasChildren) return c;
        }
        return candidates[0];
    }

    // parentIdを持つファイルアセットを検索（重複時はfileを持つものを優先）
    function findBestFile(names, parentId) {
        const candidates = editor.assets.list().filter(a =>
            names.includes(a.get('name')) &&
            getParentFromPath(a) === parentId
        );
        if (candidates.length <= 1) return candidates[0] || null;
        return candidates.find(a => a.get('file')) || candidates[0];
    }

    async function fetchGitHub(path) {
        const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`GitHub fetch failed: ${path} (${resp.status})`);
        return resp.text();
    }

    // アセットのファイル内容を取得
    async function fetchAssetContent(asset) {
        const id = asset.get('id');
        const fileData = asset.get('file');
        if (!fileData) return null;
        const filename = fileData.filename || fileData.url?.split('/').pop();
        if (!filename) return null;
        const resp = await apiGet(`/assets/${id}/file/${filename}?branchId=${branchId}`);
        return resp.text();
    }

    // --- GitHub Tree 取得 ---
    console.log('[update] Fetching GitHub tree...');
    const treeResp = await fetch(
        `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`
    );
    if (!treeResp.ok) {
        console.error('[update] GitHub API error:', await treeResp.text());
        return;
    }
    const treeData = await treeResp.json();
    const items = treeData.tree.filter(t => t.path.startsWith(ROOT + '/'));
    const folders = items
        .filter(t => t.type === 'tree')
        .sort((a, b) => a.path.split('/').length - b.path.split('/').length);
    const files = items.filter(t => t.type === 'blob');

    console.log(`[update] GitHub: ${folders.length} folders, ${files.length} files`);

    // --- フォルダ解決・作成 ---
    const folderIds = {};

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

            const existing = findBestFolder(name, parentId);
            if (existing) {
                folderIds[r] = existing.get('id');
                console.log(`[update] = folder: ${r}`);
                continue;
            }

            const parentAsset = parentId ? editor.assets.get(parentId) : null;
            const opts = { name };
            if (parentAsset) opts.folder = parentAsset;
            editor.assets.createFolder(opts);
            toCreate.push({ r, name, parentId });
            console.log(`[update] creating folder: ${r}...`);
        }

        if (toCreate.length === 0) continue;
        await delay(3000);

        for (const { r, name, parentId } of toCreate) {
            const created = await new Promise((resolve, reject) => {
                const start = Date.now();
                const check = () => {
                    const found = editor.assets.list().find(a =>
                        a.get('name') === name &&
                        a.get('type') === 'folder' &&
                        getParentFromPath(a) === parentId
                    );
                    if (found) return resolve(found);
                    if (Date.now() - start > 30000) return reject(new Error(`Timeout: folder ${r}`));
                    setTimeout(check, 300);
                };
                check();
            });
            folderIds[r] = created.get('id');
            console.log(`[update] + folder: ${r} (id=${created.get('id')})`);
        }
    }

    // --- ファイル更新・作成 ---
    console.log('[update] Updating files...');

    for (const f of files) {
        const r = rel(f.path);
        const parts = r.split('/');
        const fileName = parts[parts.length - 1];
        const parentRel = parts.slice(0, -1).join('/');
        const parentId = parentRel ? folderIds[parentRel] : null;

        // GitHub からコンテンツ取得
        const remoteContent = await fetchGitHub(f.path);

        // アセット名を決定 (.md.txt → .md)
        let assetName = fileName;
        let blobName = fileName;
        if (/\.\w+\.txt$/.test(fileName)) {
            assetName = fileName.slice(0, -4);
            blobName = fileName;
        }

        // 既存アセットを検索（.md.txt / .md どちらで作られていても検出）
        let existing = findBestFile([assetName, fileName], parentId);

        if (existing) {
            const fileData = existing.get('file');
            const existingFilename = fileData?.filename || fileData?.url?.split('/').pop() || fileName;

            // TEMPLATE_BOUNDARY がリモート・ローカル両方にあればマージ
            // 上部=テンプレート(リモートで更新) / 下部=プロジェクト固有(ローカルを保持)
            if (remoteContent.includes(MARKER)) {
                const currentContent = await fetchAssetContent(existing);
                if (currentContent && currentContent.includes(MARKER)) {
                    const localParts = currentContent.split(MARKER);
                    const remoteParts = remoteContent.split(MARKER);
                    const merged = remoteParts[0] + MARKER + localParts.slice(1).join(MARKER);
                    const blob = new Blob([merged], { type: 'text/plain' });

                    try {
                        await apiPut(existing.get('id'), blob, existingFilename);
                        console.log(`[update] * ${r} (template updated, project-specific preserved)`);
                    } catch (e) {
                        console.error(`[update] x merge failed: ${r}`, e.message);
                    }
                    continue;
                }
            }

            // TEMPLATE_BOUNDARY なし → 全体上書き
            const mime = fileName.endsWith('.json') ? 'application/json' : 'text/plain';
            const blob = new Blob([remoteContent], { type: mime });

            try {
                await apiPut(existing.get('id'), blob, existingFilename);
                console.log(`[update] * ${r}`);
            } catch (e) {
                console.error(`[update] x update failed: ${r}`, e.message);
            }
        } else {
            // 新規作成 (REST API POST)
            const mime = fileName.endsWith('.json') ? 'application/json' : 'text/plain';
            const formData = new FormData();
            formData.append('name', assetName);
            formData.append('projectId', projectId);
            formData.append('branchId', branchId);
            if (parentId != null) formData.append('parent', parentId);
            formData.append('preload', 'true');
            formData.append('file', new Blob([remoteContent], { type: mime }), blobName);

            try {
                await apiPost(formData);
                console.log(`[update] + ${r} (new)`);
            } catch (e) {
                console.error(`[update] x create failed: ${r}`, e.message);
            }
        }
    }

    console.log('[update] Done!');
})();
