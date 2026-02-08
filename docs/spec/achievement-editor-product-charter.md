# Achievement Editor プロダクト定義（旧実装SSOT）

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-07

## 目的/背景

- `achievement-editor` は、FF14 のアチーブメント編集データを管理するための運用者向けツールである。
- 旧 Vue/Nuxt 実装には「カテゴリ別アチーブメント編集」「タグ/パッチ管理」「Lodestone関連情報の取得補助」が実装されている。
- 今後の React 移行・再実装では、**旧実装の仕様をSSOT（唯一の真実）** とし、機能・挙動・データ運用の乖離を許容しない。

## 仕様

1. Product Charter（何を実現するか）
- 対象ユーザー:
  - アチーブメント定義データを運用・更新する編集者。
- 解決する課題:
  - 大量のアチーブメントデータをカテゴリ単位で編集し、タグ・パッチ情報を整合させながら保存する。
- 提供価値:
  - 画面上の編集操作（追加・分類・並び替え・タグ/パッチ割当）と保存を一貫して実行できる。
  - Lodestone URL 由来の補助取得（非公開アチーブメント、アイコン、アイテム情報）を使って入力負荷を下げる。

2. IA / 画面責務（旧実装基準）
- 共通レイアウト（`layouts/default.vue`）:
  - `KIND` 一覧に基づくカテゴリページ導線を表示する。
  - `/tag`、`/patch` への導線を表示する。
  - `loginButton` と全画面共通スナックバーを提供する。
- カテゴリ編集ページ:
  - `/battle`
  - `/character`
  - `/crafting_gathering`
  - `/exploration`
  - `/grand_company`
  - `/items`
  - `/legacy`
  - `/pvp`
  - `/quests`
  - いずれも `itemsEditor` を使い、該当 `KIND` の編集を行う。
- `/tag`:
  - タグ定義の追加/編集/削除、ネストタグ管理、保存。
  - 必要時にタグID強制更新とアチーブメント側追従更新。
- `/patch`:
  - パッチ定義の追加/編集/削除、保存。
  - 必要時にパッチID強制更新とアチーブメント側追従更新。

3. データロード・保存仕様
- 初期ロード:
  - `nuxtServerInit` で `TagStore.fetchTags()`、`PatchStore.fetchPatches()`、`AchievementStore.fetchAchievements()` を実行する。
  - 取得元は Cloud Storage 公開データ（`forfan-resource`）であり、旧実装では `@murofush/forfan-common-package` の `get*FromCloudStorage` 系関数から参照する。
  - 取得（read）は backend 未接続でも成立する。
- 保存:
  - タグ/パッチ/アチーブメント編集結果は `/api/save_text` を通じて保存する。
  - 保存（write）は backend 依存であり、未実装時は編集結果を永続化できない。
- Lodestone関連取得:
  - `achievementCreator` から以下を利用する。
  - `/api/get_hidden_achievement`
  - `/api/get_icon_img`
  - `/api/get_item_infomation`
  - 上記3 API は backend 実装責務であり、admin-front 単体では成立しない。

4. システム境界（front / admin-front / backend）
- `achievement-editor` は `admin-front` に該当する。
- `admin-front` の責務:
  - Cloud Storage 由来データの参照
  - 編集UIの提供
  - backend API 呼び出し
- `backend` の責務:
  - `/api/save_text`
  - `/api/get_hidden_achievement`
  - `/api/get_icon_img`
  - `/api/get_item_infomation`
- `AchievementFetcher` の責務:
  - Lodestone から `achievementData` 系データを生成するバッチ処理
  - 実行時の編集APIではない

5. 機能スコープ
- Must（旧実装同等の成立条件）:
  - カテゴリ単位のアチーブメント編集（作成、分類、並び替え、削除）。
  - グループ編集（作成、名称編集、タグ割当、パッチ割当）。
  - タグ管理（ネスト含む）と保存。
  - パッチ管理と保存。
  - Lodestone関連補助取得APIを使った作成補助。
  - 共通スナックバー通知とログイン表示導線。
- Should（同等性を損なわない改善余地）:
  - UI/コード構造の改善（Feature First化、型強化）。
  - バリデーションやエラーメッセージ整理。
- Out（本仕様の対象外）:
  - 旧実装に存在しない新規ユースケース（例: Profile Builder専用機能）。
  - 旧仕様と矛盾する画面責務の置換。

6. SSOT適用ルール（乖離禁止）
- 旧 Vue/Nuxt 実装を仕様基準として扱う。
- React 実装へ移す際は、旧実装と同等であることをテストまたは再現手順で確認する。
- 旧実装からの差分を導入する場合は、**仕様書更新を先に行い、承認後に実装** する。

## 受け入れ条件

- `achievement-editor` の機能判断で、旧実装の画面責務・動作を基準に説明できる。
- React 実装の作業項目ごとに「旧実装同等性」の確認観点が提示される。
- 旧実装に存在しない機能を追加する場合、事前に仕様変更として合意される。

## 非ゴール

- 旧実装の責務を無視した短期的な機能置換。
- 仕様合意なしでのユースケース変更。
- `chara-card-creator` との機能統合。

## 影響範囲

- Front: `apps/achievement-editor` の画面責務と遷移設計の基準化。
- Back: 旧APIエンドポイントの互換維持方針の明確化。
- Domain: アチーブメント編集データ運用ルールの固定化。
- Infra: 既存ビルド検証運用への影響はなし（Docs変更）。
- Docs: 本仕様、索引、TODO。

## 既存挙動との差分

- 直前の Draft では「現行React Profile Builder主系」を前提としていた。
- 本仕様ではそれを撤回し、旧Vue実装の責務をSSOTとして確定した。

## 移行/互換方針

- 移行先（React）は、旧実装の画面責務・編集フロー・保存フローを同等に再現する。
- 移行期間中に旧実装と差分が出る場合は、暫定運用ではなく仕様差分として管理する。
- 同等性が確認できるまで、旧実装由来の仕様を破棄しない。

## 関連リンク

- `docs/spec/README.md`
- `docs/TODO.md`
- `docs/spec/achievement-editor-legacy-screen-responsibilities.md`
- `docs/spec/achievement-editor-legacy-api-data-contract.md`
- `docs/spec/achievement-editor-functional-equivalence-checklist.md`
- `apps/achievement-editor/layouts/default.vue`
- `apps/achievement-editor/pages/`
- `apps/achievement-editor/components/itemsEditor.vue`
- `apps/achievement-editor/components/achievementCreator.vue`
- `apps/achievement-editor/store/index.ts`
