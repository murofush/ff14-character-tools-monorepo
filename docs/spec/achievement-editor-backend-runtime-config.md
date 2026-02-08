# Achievement Editor Backend 実行環境・運用設定仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-08

## 目的/背景

- backend 実装時に、環境変数・権限・デプロイ要件の曖昧さで手戻りが起きないようにする。
- `admin-front` の保存とLodestone補助取得を安定運用するための最小要件を定義する。

## 仕様

1. 推奨デプロイ形態
- 採用:
  - Cloud Run（API） + Cloud Storage（データ/画像） + Cloud Logging（監視）
- 採用理由:
  - 既存資産（`forfan-common-package` / `ldst-scraper` 由来）との親和性が高い。
  - GCS 認可を IAM で管理しやすい。

2. 必須環境変数
- `PORT`
  - API待受ポート（Cloud Run では通常 `8080`）
- `FORFAN_RESOURCES_BUCKET`
  - 保存対象バケット名（既定: `forfan-resource`）
- `FORFAN_RESOURCES_PUBLIC_BASE_URL`
  - 公開参照URL（既定: `https://forfan-resource.storage.googleapis.com`）
- `ADMIN_FRONT_ORIGIN`
  - CORS 許可する admin-front の origin
- `LODSTONE_REQUEST_TIMEOUT_MS`
  - Lodestone取得タイムアウト（推奨: `15000`）
- `ENABLE_STRICT_JSON_VALIDATION`
  - `save_text` で JSON 厳格検証するか（`true`/`false`）
- `FIREBASE_PROJECT_ID`
  - Firebase ID Token 検証対象プロジェクトID
- `FIREBASE_AUTH_EMULATOR_HOST`（任意）
  - ローカル検証時のエミュレータ接続先

3. 認可要件
- API実行サービスアカウントに以下権限を付与する。
  - `roles/storage.objectAdmin`（対象バケット限定推奨）
- 認証方式は Firebase ID Token 検証を採用する。
- `/api/*` を呼び出すクライアントは運用者認証済みであること。
- 未認証アクセスは `401` を返すこと。

4. CORS 要件
- 許可originを `ADMIN_FRONT_ORIGIN` のみに制限する。
- `Access-Control-Allow-Methods` は `GET,POST,OPTIONS`。
- `credentials` 利用時はワイルドカード禁止。

5. ログ・監視
- 全APIで `requestId` を払い出し、次を記録する。
  - endpoint
  - durationMs
  - status
  - errorCode（失敗時）
- 監視アラート基準（初期値）:
  - 5xx 比率 > 5%（5分）
  - `save_text` 失敗連続 10 回

6. レート制御
- `get_*` 系は利用者単位制限（例: 60 req/min）。
- `save_text` はより厳格に制限（例: 20 req/min）。

7. 段階設定
- Phase 1/2:
  - `ENABLE_STRICT_JSON_VALIDATION=false`
  - `get_*` は `200 + LocalError` 互換を維持
- Phase 3:
  - `ENABLE_STRICT_JSON_VALIDATION=true`
  - `get_*` は `4xx/5xx + LocalError` へ移行

8. ローカル開発
- `apps/backend` は `.env.local` で上記環境変数を読み込む。
- 疎通確認:
  - `POST /api/save_text` にテストJSONを送って保存確認
  - `GET /api/get_hidden_achievement` に検証URLを送って抽出確認

## 受け入れ条件

- backend 起動に必要な環境変数が不足なく定義されている。
- 権限不足時に保存失敗を明確に検知できる。
- CORS が `admin-front` 限定で機能する。

## 非ゴール

- Cloud Run 以外の全プラットフォーム用の詳細運用手順を網羅すること。

## 影響範囲

- Front: `apps/achievement-editor` の API 接続設定
- Back: `apps/backend` の起動設定・ミドルウェア
- Domain: 保存対象データの整合性
- Infra: IAM/CORS/監視設定
- Docs: backend API 仕様との整合

## 既存挙動との差分

- 既存資料には backend の実行時設定が明文化されていなかった。
- 本仕様で「何を設定すれば運用可能か」を固定した。

## 移行/互換方針

- まずは Cloud Run 想定で運用し、必要があれば別環境向け設定を追記する。
- 既存 API 契約（`/api/*`）は維持したまま、内部設定のみ置換可能とする。

## 関連リンク

- `docs/spec/achievement-editor-backend-api-spec.md`
- `docs/spec/monorepo-product-architecture.md`
- `docs/spec/achievement-editor-legacy-api-data-contract.md`
