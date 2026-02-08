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
- `BACKEND_SAVE_ROOT`:
  - `save_text` の保存先ルート（既定: `./local-storage/forfan-resource`）
- `STATIC_BEARER_TOKEN`:
  - Bearer 認証トークン（既定: `local-dev-token`）
- `STATIC_OPERATOR_UID`:
  - 認証成功時の疑似UID（既定: `local-operator`）
- `API_ERROR_MODE`:
  - `compat` または `http`（既定: `compat`）
- `ENABLE_STRICT_JSON_VALIDATION`:
  - `save_text` のJSON厳格検証（既定: `false`）
- `LODSTONE_REQUEST_TIMEOUT_MS`:
  - Lodestone取得タイムアウトms（既定: `15000`）
- `ADMIN_FRONT_ORIGIN`:
  - CORS許可Origin（未指定ならCORSヘッダ無効）

## 実装済みエンドポイント

- `POST /api/save_text`
- `GET /api/get_hidden_achievement`
- `GET /api/get_icon_img`
- `GET /api/get_item_infomation`

## テスト

```bash
pnpm --filter @ff14/achievement-backend test
```
