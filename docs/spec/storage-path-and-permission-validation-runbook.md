# Cloud Storage パス・権限検証ランブック

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-12

## 目的/背景

- 旧実装同等性に必要なデータパスが実環境に存在し、`read`/`write` 権限が正しく設定されていることを確認する。
- 未確認のまま移行完了と判定しないため、検証手順を標準化する。

## 仕様

1. 検証対象
- バケット:
  - `forfan-resource`（環境により別名の場合は読み替え）
- 主要オブジェクトパス:
  - `tag/tag.json`
  - `patch/patch.json`
  - `editedAchievementData/<kind>/<category>.json`
  - `achievementData/img/<category>/<group>/...`（`get_icon_img` / `get_item_infomation` 用）

2. 期待される責務
- `read`:
  - front/admin-front が参照可能であること。
- `write`:
  - backend 実行サービスアカウントのみが保存可能であること。
  - front/admin-front からの直接書き込みは許可しないこと。

3. 検証手順（実環境）
- 手順A: 存在確認
  - `tag/tag.json` と `patch/patch.json` の存在確認
  - 代表カテゴリの `editedAchievementData/*` 存在確認
- 手順B: 公開設定確認
  - 読み取り対象の公開設定または配布経路（署名URL/CDN）を確認
- 手順C: 書き込み権限確認
  - backend 経由 `POST /api/save_text` で保存成功すること
  - 非認証/非権限主体で保存拒否（401/403）されること
- 手順D: 画像保存確認
  - `GET /api/get_icon_img` / `GET /api/get_item_infomation` 実行後、対象パスに保存されること

4. 記録フォーマット
- 検証日:
- 環境:
- 実施者:
- backend 実行ID:
- 結果:
  - `tag/tag.json`:
  - `patch/patch.json`:
  - `editedAchievementData/*`:
  - `achievementData/img/*`:
- 課題:
- 対応期限:

5. 判定基準
- すべての必須パスが確認でき、認証・権限が期待通りであること。
- 1つでも未確認または不整合がある場合、移行完了判定を保留する。

## 受け入れ条件

- 本ランブックに基づく実施記録が残っている。
- `docs/TODO.md` の OPS 未完タスクをクローズできる。

## 非ゴール

- IaC化そのものの実装。
- 監視アラート閾値の詳細最適化。

## 影響範囲

- Front/Admin-front: 読み取り可否の運用確認。
- Back: 書き込み主体・認可設定確認。
- Infra: GCS IAM / 公開設定 / オブジェクト配置。
- Docs: TODO と移行完了判定の証跡管理。

## 既存挙動との差分

- 既存は TODO に未確認項目があるのみで、具体手順が定義されていなかった。
- 本仕様で実施手順と判定基準を固定した。

## 移行/互換方針

- 環境追加時（staging/prod 追加）も同一ランブックを適用する。
- パス構成が変わる場合は本仕様を先に更新する。

## 関連リンク

- `docs/spec/achievement-editor-backend-api-spec.md`
- `docs/spec/achievement-editor-backend-runtime-config.md`
- `docs/spec/migration-completion-runbook.md`
- `docs/TODO.md`
