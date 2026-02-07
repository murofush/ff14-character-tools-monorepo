# TODO

このリストは仕様書とは別に、常に最新の作業計画を管理するためのものです。

## 運用ルール

- 大きなタスク依頼時は着手前にTODOを作成/更新する
- TODOは実行可能な細かな粒度まで分解して記載する
- 進捗に応じてチェックや内容更新を行う
- Front/Backを分割せず1ファイルで管理する
- 各項目の先頭に `[FE]` / `[BE]` / `[CROSS]` / `[INFRA]` / `[DOCS]` / `[TEST]` / `[OPS]` を付けて分類する

## 現在のTODO

### [P1] 初期セットアップ

- [DOCS] [ ] 仕様書索引 (`docs/spec/README.md`) を初期化する
- [DOCS] [ ] 現行の仕様を `docs/spec/*.md` に移し、Draft/Confirmed を明記する
- [DOCS] [ ] 開発規約と検証コマンドを `AGENTS.md` に反映する

### [P1] Chara Card React段階移行

- [DOCS] [x] `apps/chara-card-creator` の段階移行仕様（Draft）を `docs/spec` に追加する
- [DOCS] [x] 仕様索引 `docs/spec/README.md` に新規仕様を登録する
- [DOCS] [ ] 機能同等チェックリスト仕様（画面/データ/API単位）を追加する
- [FE] [x] Home画面のLodestone URL/ID入力導線をReact実装へ移植する
- [TEST] [x] Lodestone URL/ID正規化ロジックの失敗先行テストを追加する
- [FE] [x] `src` を React Feature First 構成（`app/pages/features/shared`）へ再編する
- [TEST] [x] 再編後の import 解決とビルド成功を確認する

### [P1] Achievement Editor React構成統一

- [FE] [x] `apps/achievement-editor/src` を Feature First 構成（`app/pages/features/shared`）へ再編する
- [TEST] [x] 再編後の import 解決とビルド成功を確認する
