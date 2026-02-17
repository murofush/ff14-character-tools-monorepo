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
- [DOCS] [x] 機能同等チェックリスト仕様（画面/データ/API単位）を追加する
- [DOCS] [x] 旧実装の画面責務仕様（ルート/主要コンポーネント責務）を追加する
- [DOCS] [x] 旧実装のAPI・データ契約仕様（取得/同期/選択/保存）を追加する
- [DOCS] [x] `/api/get_character_info` の backend 実装契約仕様を追加する
- [FE] [x] Home画面のLodestone URL/ID入力導線をReact実装へ移植する
- [TEST] [x] Lodestone URL/ID正規化ロジックの失敗先行テストを追加する
- [FE] [x] `src` を React Feature First 構成（`app/pages/features/shared`）へ再編する
- [TEST] [x] 再編後の import 解決とビルド成功を確認する

### [P1] Achievement Editor React構成統一

- [FE] [x] `apps/achievement-editor/src` を Feature First 構成（`app/pages/features/shared`）へ再編する
- [TEST] [x] 再編後の import 解決とビルド成功を確認する

### [P1] React UI基盤統一（Tailwind + Headless UI）

- [FE] [x] `apps/chara-card-creator` に Tailwind / PostCSS 設定を導入し、既存ページをTailwindクラスへ置換する
- [FE] [x] `apps/chara-card-creator` に shadcn/ui 互換プリミティブ（Button/Card/Input/Textarea/Badge）を追加する
- [FE] [x] `apps/chara-card-creator` の共通ナビを Headless UI（Disclosure）でモバイル対応する
- [FE] [x] `apps/achievement-editor` に Tailwind / PostCSS 設定を導入し、既存ページをTailwindクラスへ置換する
- [FE] [x] `apps/achievement-editor` に shadcn/ui 互換プリミティブ（Button/Card/Input/Textarea/Badge）を追加する
- [FE] [x] `apps/achievement-editor` の共通ナビと主要UIで Headless UI（Disclosure/Listbox/Tab）を採用する
- [TEST] [x] 旧ルート群のReact側定義をテストで追加し、`pnpm --filter @ff14/chara-card-creator test` を通す
- [TEST] [x] 旧ルート群のReact側定義をテストで追加し、`pnpm --filter @ff14/achievement-editor test` を通す
- [TEST] [x] `pnpm --filter @ff14/chara-card-creator build` と `pnpm --filter @ff14/achievement-editor build` の成功を確認する
- [FE] [x] `achievement-editor` の `itemsEditor` コア処理（並び替え/グループ作成削除/タグ・パッチ共通値/未分類↔分類移動）を純関数として移植する
- [FE] [x] `achievement-editor` のカテゴリ編集ページに上記コア処理を接続し、カテゴリ差分とローカル保存導線を実装する
- [TEST] [x] コア処理の失敗先行テストを追加し、`pnpm --filter @ff14/achievement-editor test` / `build` の成功を確認する
- [FE] [x] `achievement-editor` のカテゴリ編集データを Cloud Storage（`forfan-resource`）から取得する実装へ切替する
- [FE] [x] カテゴリ単位の保存処理を `/api/save_text` へ接続し、`editedAchievementData/{routeKey}/{category}.json` へ保存する
- [TEST] [x] 旧JSON形式⇔React編集モデル変換と save_text リクエスト生成のテストを追加する
- [FE] [x] `achievementCreator` の URL取得（`/api/get_hidden_achievement`）と手入力作成を React 側へ移植する
- [FE] [x] `achievementCreator` の補助取得（`/api/get_icon_img` / `/api/get_item_infomation`）を React 側へ移植する
- [TEST] [x] `achievementCreator` のフォームバリデーションと作成payload契約のテストを追加する
- [FE] [x] `tag / patch` 強制ID更新ロジック（挿入時繰上げ/削除時繰下げと参照追従）を純関数として移植する
- [TEST] [x] 強制ID更新ロジックの失敗先行テストを追加し、`pnpm --filter @ff14/achievement-editor test` / `build` の成功を確認する
- [FE] [x] `/tag` React画面へタグ定義CRUDと `isForceTagUpdate` 連動の全アチーブメント追従更新を接続する
- [FE] [x] `/patch` React画面へパッチ定義CRUDと `isForcePatchUpdate` 連動の `adjustmentPatchId` 追従更新を接続する
- [FE] [x] `tag/tag.json` `patch/patch.json` の読込保存と、追従更新後の全カテゴリ一括保存導線を追加する
- [FE] [x] `/tag` のネスト編集UI（階層操作/並び替え）を旧Vue同等で移植する
- [TEST] [x] `/tag` ネスト編集（追加/削除/子タグ昇格/並び替え）の同等性テストを追加する
- [OPS] [ ] `tag/tag.json` `patch/patch.json` `editedAchievementData/*` のCloud Storage実在パス・公開設定・権限を実環境で確認する
- [FE] [ ] 旧Vue実装の編集ロジック（カテゴリ編集/タグ管理/パッチ管理）の機能完全移植を継続する

### [P1] 旧Vue比 未完機能の実装（仕様確定済）

- [FE] [x] `chara-card-creator` `/select-achievement` に旧 `selectAchievement.vue` の機能責務（カテゴリ/グループ閲覧、選択済みパネル、モバイル導線）を完全移植する
- [FE] [x] `chara-card-creator` `/edit-chara-card` の基礎責務（画像アップロード/トリミング導線、設定UI、プレビュー、`chara_card.png` 保存、編集状態復元）を現行実装へ移植する
- [FE] [x] `chara-card-creator` `/edit-chara-card` に緩和前取得強調ロジック（`adjustmentPatchId` と `patch/patch.json` の日付比較）を移植する
- [FE] [x] `chara-card-creator` `/edit-chara-card` にキャラクター詳細表示（FC/PvP/ジョブ要約）をプレビュー・PNG出力へ移植する
- [FE] [x] `chara-card-creator` `/edit-chara-card` に実績報酬表示（称号/アイテム名/アイテム画像）をプレビュー・PNG出力へ移植する
- [FE] [x] `chara-card-creator` `/edit-chara-card` にFCクレスト/所属階級表示（画像+名称）をプレビュー・PNG出力へ移植する
- [FE] [ ] `chara-card-creator` `/edit-chara-card` に旧 `editCharaCard.vue` + `characterCard/*` の機能責務（画像トリミング、カード設定、PNG保存）を完全移植する
- [FE] [ ] `chara-card-creator` `/edit-chara-card` の旧Canvas同等責務（ジョブアイコン描画、旧Konva文字組みレイアウト微差の解消）を追加移植する（※ `getJobSubImagePath` 相当の旧実装ソース未確認）
- [FE] [x] `achievement-editor` に旧 `loginButton` と認証状態表示導線を移植する
- [FE] [x] `achievement-editor` に旧 `OUTPUT_SNACKBAR` 相当の全画面共通通知レイヤーを移植する
- [FE] [x] `achievement-editor` カテゴリ編集に「テーブル全体保存」導線を移植する
- [FE] [x] `achievement-editor` カテゴリ編集にグループ名編集ダイアログを移植する
- [FE] [x] `achievement-editor` カテゴリ編集にアチーブメント個別タグ/パッチ編集ダイアログを移植する
- [FE] [x] `achievement-editor` カテゴリ編集にドラッグ&ドロップ並び替え（未分類/分類済/グループ順）を移植する

### [P1] API集約・認証・完了判定の最終化

- [DOCS] [x] `/api/*` の所有権とルーティング方針（backend集約）を仕様化する
- [DOCS] [x] `achievement-editor` の認証・セッション契約（ログインUI/トークン更新/401時再認証）を仕様化する
- [DOCS] [x] 移行完了判定ランブック（自動/手動/運用ゲート）を仕様化する
- [DOCS] [x] Cloud Storage パス・権限検証ランブックを仕様化する
- [BE] [x] `apps/backend` に `GET /api/get_character_info` を追加実装する（旧 `apps/chara-card-creator/api/index.ts` 契約互換）
- [FE] [x] `apps/chara-card-creator` のキャラクター取得呼び先を backend 統一URLへ切替する
- [FE] [x] `apps/achievement-editor` に認証状態表示UI（旧 `loginButton` 責務）を移植する
- [FE] [x] `apps/achievement-editor` で Firebase ID Token を API 呼び出しへ自動付与する
- [OPS] [ ] `docs/spec/storage-path-and-permission-validation-runbook.md` を実施し、結果を記録する
- [TEST] [ ] `docs/spec/migration-completion-runbook.md` に従って完了判定を実施する

### [P1] プロダクト定義整理

- [DOCS] [x] `chara-card-creator` のプロダクト定義（目的/画面責務/スコープ/受け入れ条件/移行境界）を仕様化する
- [DOCS] [x] `achievement-editor` のプロダクト定義（目的/画面責務/スコープ/受け入れ条件/移行境界）を仕様化する
- [DOCS] [x] 仕様索引 `docs/spec/README.md` に新規仕様を登録する

### [P1] Achievement Editor 旧実装SSOT確定

- [DOCS] [x] `achievement-editor` のプロダクト定義を「旧Vue実装をSSOT」とする内容へ改訂する
- [DOCS] [x] 旧実装ベースの画面責務・機能スコープ・互換方針を明文化する
- [DOCS] [x] 仕様索引のステータスを同期する（Draft/Confirmed）
- [DOCS] [x] 旧実装の画面責務仕様（ルート/コンポーネント責務）を追加する
- [DOCS] [x] 旧実装のAPI・データ契約仕様（保存/取得/ID再採番）を追加する
- [DOCS] [x] 機能同等チェックリスト（機能完全移植判定用）を追加する

### [P1] モノレポ責務定義の再固定

- [DOCS] [x] `front / admin-front / backend` の責務分離を仕様化する
- [DOCS] [x] `achievementData` の取得経路（Cloud Storage）と保存経路（backend API）を仕様へ反映する
- [DOCS] [x] `AchievementFetcher` をバッチ責務として明記し、実行時API責務と分離する

### [P1] Backend API 仕様具体化

- [DOCS] [x] `/api/save_text` `/api/get_hidden_achievement` `/api/get_icon_img` `/api/get_item_infomation` の実装仕様を作成する
- [DOCS] [x] backend の実行環境・権限・CORS・監視設定の仕様を作成する
- [DOCS] [x] 仕様索引と関連仕様リンクを同期する
- [DOCS] [x] 推奨案（認証/エラー方針/JSON検証/履歴管理/デプロイ）で仕様を確定する

### [P1] Backend API Go 実装（Phase 1）

- [BE] [x] `apps/backend` に `/api/save_text` `/api/get_hidden_achievement` `/api/get_icon_img` `/api/get_item_infomation` を実装する
- [TEST] [x] backend API の認証/バリデーション/互換レスポンスの失敗先行テストを追加し、`go test` を通す
- [BE] [x] ローカル保存用 `TextStorage` 実装と固定トークン `TokenValidator` 実装を追加する
- [CROSS] [x] `pnpm` から backend を起動/ビルド/テストできるコマンドを追加する

### [P1] Backend API Go 実装（Phase 2: 本番互換）

- [BE] [x] 固定トークン認証を Firebase ID Token 検証へ切替可能にする（`AUTH_BACKEND=firebase`）
- [BE] [x] `save_text` の保存先を Cloud Storage (`STORAGE_BACKEND=gcs`) へ切替可能にする
- [BE] [x] `get_icon_img` / `get_item_infomation` で画像保存を実装し、返却パスと実体を一致させる
- [BE] [x] `requestId` 付き構造化ログ（成功/失敗）を実装する
- [BE] [x] `get_*` 系 / `save_text` のレート制限を実装する
- [TEST] [x] Firebase 認証失敗時 / 権限不足時のエラー系テストを追加する
- [TEST] [x] Cloud Storage 保存成功/失敗のユニットテストを追加する
- [TEST] [ ] Cloud Run + 実GCSバケットでのE2E疎通テストを追加する
