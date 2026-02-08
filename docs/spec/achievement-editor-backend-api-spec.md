# Achievement Editor Backend API 実装仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-08

## 目的/背景

- `achievement-editor` の React 完全移行に必要な backend API を、旧実装互換で再定義する。
- 旧 front は `/api/*` を前提としており、保存処理と Lodestone 補助取得の実装がないと機能同等が成立しない。

## 仕様

1. 設計原則
- 旧フロント契約（エンドポイント名・params・レスポンス形）を最優先で互換維持する。
- `read`（Cloud Storage 直取得）と `write`（backend API）の責務分離を維持する。
- 保存APIは「どこへでも書けるAPI」にせず、保存先パスを明示的に制限する。
- 認証は Firebase ID Token 検証を採用する。

2. エンドポイント一覧
- `POST /api/save_text`
- `GET /api/get_hidden_achievement`
- `GET /api/get_icon_img`
- `GET /api/get_item_infomation`

3. `POST /api/save_text`
- 用途:
  - タグ/パッチ/編集済みアチーブメントJSONの保存。
- リクエスト:
  - `text: string`
  - `path: string`
- `path` 許可ルール:
  - `editedAchievementData/<kind>/<category>.json`
  - `tag/tag.json`
  - `patch/patch.json`
- 保存先:
  - GCS バケット `forfan-resource`（環境変数で上書き可能）
- バリデーション:
  - `path` が許可パターン外なら `400`
  - `text` が空文字なら `400`
  - `text` の JSON 厳格検証は段階適用（Phase 1/2 は緩和モード、Phase 3 で厳格モード）
- レスポンス（成功）:
  - `200 { ok: true, path: string, bytes: number, updatedAt: string }`
- エラー:
  - `401/403` 認証・認可失敗
  - `400` バリデーション失敗
  - `500` 保存失敗

4. `GET /api/get_hidden_achievement`
- 用途:
  - Lodestone のアチーブメント詳細URLから `EditAchievement` 相当を返す。
- クエリ:
  - `url: string`
  - `category: string`
  - `group: string`
- バリデーション:
  - `url` が `CHARACTER_REGEXP` 相当に一致
  - `category`, `group` が空でない
- 処理:
  - Lodestoneページ取得
  - `forfan-common-package/AchievementFetcher/src/common.ts` の抽出ロジック準拠で情報を抽出
  - 旧frontで期待する `EditAchievement` へ整形
- レスポンス（成功）:
  - `200` + `EditAchievement`
- レスポンス（失敗）:
  - Phase 1/2: `200` + `LocalError`（旧互換）
  - Phase 3: `4xx/5xx` + `LocalError` へ移行

5. `GET /api/get_icon_img`
- 用途:
  - アイコンURLを検証し、サーバ側で保存して `iconPath` を返す。
- クエリ:
  - `url: string`
  - `category: string`
  - `group: string`
- 保存先ルール:
  - `achievementData/img/<category>/<group>/<filename>.png`
- レスポンス（成功）:
  - `200` + `string`（`iconPath`）
- レスポンス（失敗）:
  - `LocalError` 互換で返す。

6. `GET /api/get_item_infomation`
- 用途:
  - Lodestone アイテムURLからアイテム名/画像URLを抽出し、画像を保存して返す。
- クエリ:
  - `url: string`
  - `category: string`
  - `group: string`
- 保存先ルール:
  - `achievementData/img/<category>/<group>/item/<filename>.png`
- レスポンス（成功）:
  - `200` + `FetchedItemData`
  - `itemAward`
  - `itemAwardUrl`
  - `itemAwardImageUrl`
  - `itemAwardImagePath`
- レスポンス（失敗）:
  - `LocalError` 互換で返す。

7. 認証・認可
- 採用方式:
  - Firebase ID Token 検証（`Authorization: Bearer <token>`）
- 認可対象:
  - `admin-front` のログイン済み運用者のみ許可
- 必須条件:
  - `POST /api/save_text` は認証必須
  - `GET /api/get_hidden_achievement` / `GET /api/get_icon_img` / `GET /api/get_item_infomation` も認証必須

8. 監視・運用
- 各APIで `requestId` を発行し、成功/失敗ログを構造化出力する。
- レート制限:
  - `get_*` 系は利用者単位で制限（例: 60 req/min）。
- タイムアウト:
  - Lodestone取得系は 15 秒を上限に設定する。

9. 保存履歴管理
- 採用方式:
  - 上書き保存 + 監査ログ保存
- 監査ログ最小項目:
  - `requestId`
  - `path`
  - `actorUid`
  - `beforeHash`
  - `afterHash`
  - `updatedAt`

## 受け入れ条件

- 旧 front からエンドポイント名変更なしで接続できる。
- `save_text` が許可パスのみ保存し、それ以外を拒否できる。
- `get_hidden_achievement` / `get_icon_img` / `get_item_infomation` が `LocalError` 互換で失敗を返せる。
- 手動確認で `docs/spec/achievement-editor-functional-equivalence-checklist.md` の F/I/J/K を満たせる。
- Firebase ID Token が無効な場合に `401` を返せる。
- 監査ログが保存更新単位で記録される。

## 非ゴール

- backend の実装言語/フレームワークを本仕様で固定すること。
- Lodestone 仕様変更時の完全自動追従。

## 影響範囲

- Front: `apps/achievement-editor/components/achievementCreator.vue`, `apps/achievement-editor/store/*`
- Back: `apps/backend`（新規実装対象）
- Domain: `editedAchievementData`, `tag`, `patch`, `achievementData/img`
- Infra: GCS 書き込み権限、認証基盤、ログ収集
- Docs: 本仕様、既存契約仕様、同等チェックリスト

## 既存挙動との差分

- 旧実装では API 本体が同梱されておらず、契約のみ呼び出し側から推定していた。
- 本仕様で保存先制限・認証条件・運用要件を明示化した。
- 本版で認証方式・エラー移行方針・JSON検証適用時期・履歴管理方式を確定した。

## 移行/互換方針

- Phase 1:
  - `/api/save_text` を先に実装して編集保存を成立させる。
- Phase 2:
  - `get_hidden_achievement` / `get_icon_img` / `get_item_infomation` を実装する。
- Phase 3:
  - `get_*` 系を `4xx/5xx + LocalError` に移行し、`save_text` の JSON 厳格検証を有効化する。

## 関連リンク

- `docs/spec/monorepo-product-architecture.md`
- `docs/spec/achievement-editor-legacy-api-data-contract.md`
- `docs/spec/achievement-editor-functional-equivalence-checklist.md`
- `apps/achievement-editor/components/achievementCreator.vue`
- `apps/achievement-editor/store/achievement.ts`
- `forfan-common-package/AchievementFetcher/src/common.ts`
