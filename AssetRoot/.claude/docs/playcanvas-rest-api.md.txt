# PlayCanvas REST API Reference

Docs: https://developer.playcanvas.com/user-manual/api/
Status: Beta (endpoints may change)

## Authentication
All requests require HTTPS and Bearer token:
```
Authorization: Bearer {accessToken}
```
Tokens are generated from Organization Account page.

## Rate Limits
| Tier | Free | Paid |
|------|------|------|
| Normal | 120 req/min | 240 req/min |
| Strict | 5 req/min | 10 req/min |
| Assets | 60 req/min | 120 req/min |

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
Exceeding returns HTTP 429.

## Response Format
- Single resource: JSON object
- Multiple resources: `{ "result": [...], "pagination": { "skip", "limit", "total" } }`
- Errors: `{ "error": "message" }` with appropriate HTTP status

## Common Error Codes
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 429: Too many requests

---

## Apps

### GET /api/apps/:id
Get a single app.
- **Rate:** Normal
- **Params:** `id` (number, required)
- **Response:** `{ id, project_id, owner_id, name, description, version, release_notes, thumbnails: {s,m,l,xl}, size, views, completed_at, created_at, modified_at, url }`

### GET /api/projects/:projectId/app
Get primary app of a project.
- **Rate:** Normal
- **Params:** `projectId` (number, required)
- **Response:** Same as Get App

### GET /api/projects/:projectId/apps
List all published apps of a project.
- **Rate:** Normal
- **Params:** `projectId` (number, required)
- **Response:** Array of app objects with pagination

### POST /api/apps/download
Start async job to download app build.
- **Rate:** Strict
- **Content-Type:** application/json
- **Body:**
  | Param | Type | Required | Description |
  |-------|------|----------|-------------|
  | project_id | number | Yes | Project ID |
  | name | string | Yes | App name (max 1000 chars) |
  | scenes | number[] | Yes | Scene IDs (first = initial scene) |
  | branch_id | string | No | Branch ID (defaults to main) |
  | description | string | No | Max 10,000 chars |
  | version | string | No | Max 20 chars |
  | release_notes | string | No | Max 10,000 chars |
  | scripts_concatenate | bool | No | Concatenate scripts |
  | scripts_minify | bool | No | Minify scripts (default: true) |
  | scripts_sourcemaps | bool | No | Generate sourcemaps (default: false) |
  | optimize_scene_format | bool | No | Optimized scene format |
  | engine_version | string | No | Engine version (default: latest) |
- **Response (201):** Job object `{ id, status, messages, created_at, modified_at, data: {...} }`
- **Note:** Poll GET /api/jobs/:id until status is "complete" or "error". On complete, data contains download URL.

---

## Assets

### GET /api/projects/:projectId/assets
List assets.
- **Rate:** Normal
- **Params:**
  | Param | Type | Required | Description |
  |-------|------|----------|-------------|
  | projectId | number | Yes | Project ID (path) |
  | branchId | string | Yes | Branch ID (query) |
  | skip | number | No | Offset (default: 0) |
  | limit | number | No | Max results (default: 16, max: 100000) |
- **Response:** `{ result: [asset...], pagination: { skip, limit, total } }`
- **Asset object:** `{ id, modifiedAt, createdAt, state, name, type, scope: {type, id}, source, sourceId, tags, preload, file: {hash, filename, size, url}, parent }`

### GET /api/assets/:assetId
Get single asset.
- **Rate:** Normal
- **Params:** `assetId` (path), `branchId` (query, required)
- **Response:** Asset object

### GET /api/assets/:assetId/file/:filename
Get asset file contents (binary).
- **Rate:** Normal
- **Params:** `assetId` (path), `filename` (path), `branchId` (query, required)
- **Response:** Raw file data

### POST /api/assets
Create asset.
- **Rate:** Assets tier
- **Content-Type:** multipart/form-data
- **Supported types:** script, html, css, text, shader, json
- **Body:**
  | Param | Type | Required | Description |
  |-------|------|----------|-------------|
  | name | string | Yes | Asset name |
  | projectId | number | Yes | Project ID |
  | branchId | string | Yes | Branch ID |
  | parent | number | No | Parent asset ID (folder) |
  | preload | bool | No | Preload at runtime |
  | file | file | No | File content |
  | pow2 | bool | No | Resize texture to power-of-two |
- **Response (201):** Asset object

### PUT /api/assets/:assetId
Update asset.
- **Rate:** Assets tier
- **Content-Type:** multipart/form-data
- **Supported types:** script, html, css, text, shader, json
- **Body:**
  | Param | Type | Required | Description |
  |-------|------|----------|-------------|
  | file | file | Yes | File content |
  | pow2 | bool | No | Resize texture (default: false) |
- **Response:** Asset object
- **Example:** `curl -H "Authorization: Bearer {token}" -X PUT -F 'file=@./script.js' "https://playcanvas.com/api/assets/{assetId}"`

### DELETE /api/assets/:assetId
Delete asset permanently.
- **Rate:** Normal
- **Params:** `assetId` (path), `branchId` (query, required)
- **Response:** 200 with empty body
- **Warning:** Permanent and unrecoverable unless checkpoint exists.

---

## Branches

### GET /api/projects/:projectId/branches
List branches.
- **Rate:** Normal
- **Params:** `projectId` (path), `skip` (query, optional - last branch ID for cursor pagination)
- **Response:** `{ result: [{ id, projectId, name, createdAt, closed, latestCheckpointId, user: {id, fullName, username} }], pagination: { hasMore } }`
- **Pagination:** Cursor-based. When `hasMore: true`, pass last branch `id` as `?skip=` for next page.

### POST /api/branches
Create branch.
- **Rate:** Normal
- **Content-Type:** application/json
- **Body:**
  | Param | Type | Required | Description |
  |-------|------|----------|-------------|
  | name | string | Yes | Branch name (max 1000 chars) |
  | projectId | number | Yes | Project ID |
  | sourceBranchId | string | Yes | Source branch ID |
  | sourceCheckpointId | string | No | Checkpoint ID (default: latest) |
- **Response (201):** `{ id, projectId, name, createdAt, closed, permanent, latestCheckpointId, user }`

---

## Checkpoints

### GET /api/branches/:branchId/checkpoints
List checkpoints (newest first).
- **Rate:** Normal
- **Params:**
  | Param | Type | Required | Description |
  |-------|------|----------|-------------|
  | branchId | string | Yes | Branch ID (path) |
  | limit | number | No | Max results (max: 50) |
  | skip | string | No | Checkpoint ID for cursor pagination |
- **Response:** `{ result: [{ id, user: {id, fullName, username}, createdAt, description }], pagination: { hasMore } }`

---

## Jobs

### GET /api/jobs/:id
Get job status.
- **Rate:** Normal
- **Params:** `id` (number, required)
- **Response:** `{ id, created_at, modified_at, status: "running"|"complete"|"error", messages, data }`
- **Usage:** Poll this endpoint after Download App or Export Project until status is "complete" or "error".

---

## Projects

### POST /api/projects/:id/export
Export entire project as zip (async job).
- **Rate:** Strict
- **Params:** `projectId` (path)
- **Body:** `{ "branch_id": "..." }` (optional, defaults to main)
- **Response (201):** Job object. Poll GET /api/jobs/:id. On complete, `data.url` contains download link.

---

## Scenes

### GET /api/projects/:projectId/scenes
List scenes.
- **Rate:** Normal
- **Params:** `projectId` (path), `branchId` (query, optional - defaults to main)
- **Response:** `{ result: [{ id, projectId, name, created, modified }] }`
