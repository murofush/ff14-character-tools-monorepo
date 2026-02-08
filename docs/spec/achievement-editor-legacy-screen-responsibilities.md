# Achievement Editor 旧実装 画面責務仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-07

## 目的/背景

- `achievement-editor` を React へ移行する際に、旧 Vue/Nuxt 実装の画面責務を正確に再現するための基準を定義する。
- UI 見た目変更は許容するが、画面が担う機能責務と遷移責務は維持する。

## 仕様

1. 共通レイアウト責務（`layouts/default.vue`）
- 左ナビに `KIND` 由来のカテゴリページリンクを表示する。
- 左ナビに `/tag` と `/patch` リンクを表示する。
- 上部バーに `loginButton` を表示する。
- 全画面共通スナックバー（`OUTPUT_SNACKBAR`）を表示・制御する。

2. ルーティング責務
- ルート一覧:
  - `/battle`
  - `/character`
  - `/crafting_gathering`
  - `/exploration`
  - `/grand_company`
  - `/items`
  - `/legacy`
  - `/pvp`
  - `/quests`
  - `/tag`
  - `/patch`
- `/index` は実質空テンプレート（編集機能なし）。

3. カテゴリ編集ページ責務（`/battle` など9画面）
- 画面ごとに固定 `key` を持ち、`AchievementStore.getAchievementDataList` から対象データを取り出す。
- すべて `itemsEditor` を利用して同一編集体験を提供する。
- 画面ごとの差分は `key` のみ（編集操作仕様は同等）。

4. `itemsEditor` の画面責務
- カテゴリ単位の編集UIを提供する:
  - 未分類（ungroup）表示と並び替え
  - 分類済みグループ（group）表示と並び替え
  - グループ作成
  - アチーブメント作成（`achievementCreator` 経由）
  - タグ割当（グループ単位・個別単位）
  - パッチ割当（対応/緩和、グループ単位・個別単位）
  - グループ名編集
  - カテゴリ単位保存 / テーブル全体保存

5. `achievementCreator` の画面責務
- 2系統の作成導線を提供する:
  - キャラクターページ URL から取得（`/api/get_hidden_achievement`）
  - 手入力で新規作成
- 補助取得を提供する:
  - アイコン URL 取得（`/api/get_icon_img`）
  - アイテム情報取得（`/api/get_item_infomation`）
- 取得/作成結果を `achievement_create` として親に返す。

6. `/tag` 画面責務
- タグ定義の追加・削除・並び替え・ネスト編集を行う。
- 保存は `TagStore.postTags` を通じて実行する。
- `isForceTagUpdate` 有効時は、タグID変更をアチーブメント側 tagIds に追従反映する。

7. `/patch` 画面責務
- パッチ定義の追加・削除・並び替えを行う。
- 保存は `PatchStore.postPatches` を通じて実行する。
- `isForcePatchUpdate` 有効時は、パッチID変更をアチーブメント側 patchId / adjustmentPatchId に追従反映する。

8. ログイン表示責務（`loginButton`）
- 未ログイン時はログインボタンを表示する。
- ログイン時はプロフィール情報（表示名・UID・画像）とログアウト導線を表示する。
- `AuthStore` を通じて認証状態を同期する。

## 受け入れ条件

- React 移行後、上記ルートと画面責務が 1:1 で説明できる。
- 各カテゴリ画面が `key` 差分のみで同一編集機能を持つ。
- `/tag` と `/patch` のID強制更新導線が再現される。

## 非ゴール

- 旧 UI（Vuetify 見た目・DOM 構造）の完全一致。
- 運用上不要な視覚装飾の複製。

## 影響範囲

- Front: `apps/achievement-editor/pages`, `components`, `layouts`.
- Domain: 編集フロー上の責務境界定義。
- Docs: 本仕様・関連仕様。

## 既存挙動との差分

- なし（本仕様は旧実装の画面責務をそのまま抽出したもの）。

## 移行/互換方針

- 画面責務は同等維持、UI 見た目のみ変更許容。
- 役割統合/分割を行う場合も、操作結果と保存結果は同等とする。

## 関連リンク

- `docs/spec/achievement-editor-product-charter.md`
- `docs/spec/achievement-editor-legacy-api-data-contract.md`
- `docs/spec/achievement-editor-functional-equivalence-checklist.md`
- `apps/achievement-editor/layouts/default.vue`
- `apps/achievement-editor/pages/`
