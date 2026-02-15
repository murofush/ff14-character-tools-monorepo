# 旧Vue→現行実装 完了判定ランブック

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-12

## 目的/背景

- 「完全移行完了」を誰が見ても同じ結論にできるよう、判定手順を固定する。
- 機能同等チェックリストを実施する順序・証跡・完了ゲートを明文化する。

## 仕様

1. 完了判定の前提
- 判定対象:
  - `apps/chara-card-creator`
  - `apps/achievement-editor`
  - `apps/backend`
- 参照仕様:
  - 各プロダクトの product charter
  - 各 legacy contract
  - 各 functional equivalence checklist

2. 事前準備
- backend を起動し、認証方式を明示する（`firebase` or `static`）。
- front/admin-front の API 接続先が backend を指していることを確認する。
- 検証対象データ（tag/patch/editedAchievementData）が利用可能であることを確認する。

3. 自動検証ゲート
- `pnpm --filter @ff14/chara-card-creator build`
- `pnpm --filter @ff14/achievement-editor build`
- `pnpm --filter @ff14/achievement-backend test`
- 失敗がある場合、完了判定は `不合格`。

4. 手動検証ゲート（chara-card-creator）
- `docs/spec/chara-card-creator-functional-equivalence-checklist.md` の Must 項目を順に実施する。
- すべて `手動確認済` へ更新する。
- 重点確認:
  - 取得→選択→編集→保存の一連フロー
  - 上限4件制約
  - 画像トリミングと `chara_card.png` 出力

5. 手動検証ゲート（achievement-editor）
- `docs/spec/achievement-editor-functional-equivalence-checklist.md` の Must 項目を順に実施する。
- すべて `手動確認済` へ更新する。
- 重点確認:
  - ログイン状態表示と認証付きAPI呼び出し
  - カテゴリ編集、テーブル全体保存、タグ/パッチ強制ID追従
  - エラー通知の一貫性

6. API所有権ゲート
- `docs/spec/monorepo-api-ownership-and-routing.md` に従い、実行時 `/api/*` が backend 集約であることを確認する。
- `front` / `admin-front` に本番導線で利用するAPI実装同梱が残っていないことを確認する。

7. 運用ゲート（ストレージ/権限）
- `docs/spec/storage-path-and-permission-validation-runbook.md` を実施し、記録を残す。
- 実環境権限未確認の場合、完了判定は `条件付き不合格`。

8. 判定結果の記録
- `docs/TODO.md` の該当タスクを更新する。
- 完了時は次を記録する。
  - 実施日
  - 実施者
  - 実施コマンド結果
  - 残課題（ある場合）

## 受け入れ条件

- 自動検証・手動検証・API所有権・運用ゲートの全条件が満たされる。
- チェックリスト更新と TODO 更新の証跡が残る。

## 非ゴール

- CI/CD 実装詳細の固定化。
- 運用監視ダッシュボードの設計詳細。

## 影響範囲

- Front: 両アプリの最終移行判定。
- Back: 認証/保存/取得APIの最終接続確認。
- Infra: Cloud Storage 権限・配布経路確認。
- Docs: チェックリスト、TODO、仕様索引の更新運用。

## 既存挙動との差分

- 既存はチェックリスト単体で、完了判定の順序とゲート定義が不足していた。
- 本仕様で移行完了の判定手順を固定した。

## 移行/互換方針

- 差分が出た場合は、まず仕様差分として記録し、承認後に実装へ反映する。
- 完了判定を満たすまでは旧資産削除を行わない。

## 関連リンク

- `docs/spec/chara-card-creator-functional-equivalence-checklist.md`
- `docs/spec/achievement-editor-functional-equivalence-checklist.md`
- `docs/spec/monorepo-api-ownership-and-routing.md`
- `docs/spec/storage-path-and-permission-validation-runbook.md`
- `docs/TODO.md`
