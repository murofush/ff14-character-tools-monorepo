# achievement-backend (Go)

`achievement-editor` 向けの保存API/Lodestone補助取得APIを提供します。

## 起動

```bash
pnpm --filter @ff14/achievement-backend dev
```

`go` がローカルに無い場合は、`apps/backend/scripts/run-go.sh` が Docker (`golang:1.22`) を使って実行します。

## 主な環境変数

- `PORT`:
  - 待受ポート（既定: `8080`）
- `AUTH_BACKEND`:
  - 認証方式（`static` / `firebase`、既定: `static`）
- `BACKEND_SAVE_ROOT`:
  - `STORAGE_BACKEND=local` 時の保存先ルート（既定: `./local-storage/forfan-resource`）
- `STATIC_BEARER_TOKEN`:
  - `AUTH_BACKEND=static` 時の Bearer 認証トークン（既定: `local-dev-token`）
- `STATIC_OPERATOR_UID`:
  - `AUTH_BACKEND=static` 時の認証成功UID（既定: `local-operator`）
- `FIREBASE_PROJECT_ID`:
  - `AUTH_BACKEND=firebase` 時の Firebase プロジェクトID
- `STORAGE_BACKEND`:
  - 保存先（`local` / `gcs`、既定: `local`）
- `FORFAN_RESOURCES_BUCKET`:
  - `STORAGE_BACKEND=gcs` 時の保存バケット（既定: `forfan-resource`）
- `FORFAN_RESOURCES_PREFIX`:
  - `STORAGE_BACKEND=gcs` 時のオブジェクトprefix（既定: 空）
- `API_ERROR_MODE`:
  - `compat` または `http`（既定: `compat`）
- `ENABLE_STRICT_JSON_VALIDATION`:
  - `save_text` のJSON厳格検証（既定: `false`）
- `LODSTONE_REQUEST_TIMEOUT_MS`:
  - Lodestone取得タイムアウトms（既定: `15000`）
- `SAVE_TEXT_RATE_LIMIT_PER_MINUTE`:
  - `save_text` の利用者ごと分あたり上限（既定: `20`）
- `GET_RATE_LIMIT_PER_MINUTE`:
  - `get_*` 系の利用者ごと分あたり上限（既定: `60`）
- `ADMIN_FRONT_ORIGIN`:
  - CORS許可Origin（未指定ならCORSヘッダ無効）

## 実装済みエンドポイント

- `GET /api/get_character_info`
- `POST /api/save_text`
- `GET /api/get_hidden_achievement`
- `GET /api/get_icon_img`
- `GET /api/get_item_infomation`

## テスト

```bash
pnpm --filter @ff14/achievement-backend test
```
