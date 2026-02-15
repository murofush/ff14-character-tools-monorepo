# Monorepo API 所有権・ルーティング仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-12

## 目的/背景

- `front` / `admin-front` / `backend` の3分割方針は確定済みだが、`/api` エンドポイントの最終所有権が一部曖昧だった。
- 特に `chara-card-creator` 旧実装の `/api/get_character_info` をどこで運用するかを確定しないと、完全移行の完了条件が閉じない。

## 仕様

1. 方針候補（比較）
- 案A: `front` 内に `/api/get_character_info` を残し、`admin-front` 系APIのみ `backend` 集約。
  - メリット: 既存資産の流用が容易。
  - デメリット: API責務が分散し、運用・認証・監視が二重化する。
- 案B（★採用）: すべての実行時 `/api/*` を `backend` へ集約し、`front` / `admin-front` は API クライアントに徹する。
  - メリット: 認証・CORS・レート制限・監視を一元化できる。
  - デメリット: `front` 側の接続切替と backend 実装追加が必要。
- 案C: `front-api` と `admin-api` の2 backend に分割。
  - メリット: 責務分離が明確。
  - デメリット: 現時点では過剰分割で運用コストが高い。

2. 採用方針（確定）
- 採用案: **案B（API一元化）**。
- 実行時 API 所有権:
  - `GET /api/get_character_info` → `backend`
  - `POST /api/save_text` → `backend`
  - `GET /api/get_hidden_achievement` → `backend`
  - `GET /api/get_icon_img` → `backend`
  - `GET /api/get_item_infomation` → `backend`

3. ルーティング契約
- `front` / `admin-front` は `backendBaseUrl + /api/*` を呼び出す。
- 環境ごとに `backendBaseUrl` を切替できること（local/staging/prod）。
- `front` / `admin-front` 内部での API 実装同梱は、移行完了後は許容しない。

4. 責務境界
- `front`:
  - UI、入力検証、結果表示、ローカル状態管理。
- `admin-front`:
  - 編集UI、差分管理、保存トリガー。
- `backend`:
  - 外部取得（Lodestone）、保存、認証認可、監視、レート制限。

5. 移行中の互換方針
- 移行期間は旧 `front` 内 API 実装を参照可能とするが、新規仕様の正本は `backend` 契約とする。
- 完全移行完了判定では、`front`/`admin-front` が backend API のみを利用していることを条件に含める。

## 受け入れ条件

- 全 `/api/*` の所有先が仕様書上で一意に定義されている。
- 実装タスクで「どのエンドポイントをどのプロダクトが持つか」を迷わない。
- 完了判定時に API 一元化の有無を検証できる。

## 非ゴール

- backend の内部FW・DB設計の固定化。
- APIバージョニング戦略の詳細化。

## 影響範囲

- Front: `apps/chara-card-creator` の API 接続先切替。
- Front: `apps/achievement-editor` の API 接続先の一貫運用。
- Back: `apps/backend` への `/api/get_character_info` 追加実装。
- Infra: CORS / 認証 / 監視の一元運用。
- Docs: 本仕様、各プロダクト契約仕様、完了判定仕様。

## 既存挙動との差分

- 旧 `chara-card-creator` では API 実装を同梱していた。
- 本仕様では、実行時 API を backend に統合する前提へ変更した。

## 移行/互換方針

- 先に backend 側へ `/api/get_character_info` を実装し、front からの呼び先を切替する。
- 切替後に旧 front 内 API 実装を段階削除する。

## 関連リンク

- `docs/spec/monorepo-product-architecture.md`
- `docs/spec/chara-card-backend-api-spec.md`
- `docs/spec/chara-card-creator-legacy-api-data-contract.md`
- `docs/spec/achievement-editor-backend-api-spec.md`
- `apps/chara-card-creator/api/index.ts`
- `apps/backend/internal/api/server.go`
