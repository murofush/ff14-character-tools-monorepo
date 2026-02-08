# Achievement Editor 旧実装 API・データ契約仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-07

## 目的/背景

- 旧実装の機能同等移行には、画面操作だけでなく API 契約・データ更新規則の再現が必要。
- 本仕様は、コードから確認できる API 利用契約とデータ変換規則を SSOT として固定する。

## 仕様

1. 初期データロード契約
- `nuxtServerInit` で以下を並列実行する。
  - `TagStore.fetchTags()`
  - `PatchStore.fetchPatches()`
  - `AchievementStore.fetchAchievements()`
- ロード済みフラグ:
  - `TagStore.isLoaded`
  - `PatchStore.isLoaded`
  - `AchievementStore.isLoaded`
- 旧実装の実データ取得元:
  - Cloud Storage 公開パス（`https://forfan-resource.storage.googleapis.com/${path}.json`）
  - `editedAchievementData/${kind}/${category}.json`
  - `tag/tag.json`
  - `patch/patch.json`
- 旧実装では `@murofush/forfan-common-package` の `get*FromCloudStorage` 系関数を経由して取得する。
- 取得（read）は backend 非依存で成立する。

2. 保存 API 契約
- 共通保存エンドポイント:
  - `POST /api/save_text`
- 共通リクエストボディ:
  - `text: string`（JSON文字列）
  - `path: string`（保存先パス）
- 利用箇所:
  - `TagStore.postTags`
  - `PatchStore.postPatches`
  - `AchievementStore.postAchievementDataListByKey`
  - `pages/patch.vue` 内の `saveAchievement`（直接呼び出し）

3. Lodestone補助取得 API 契約
- アチーブメント取得:
  - `GET /api/get_hidden_achievement`
  - params:
    - `url`
    - `category`
    - `group`
  - response:
    - `EditAchievement` または `LocalError`
- アイコン取得:
  - `GET /api/get_icon_img`
  - params:
    - `url`
    - `category`
    - `group`
  - response:
    - `string`（iconPath）または `LocalError`
- アイテム取得:
  - `GET /api/get_item_infomation`
  - params:
    - `url`
    - `category`
    - `group`
  - response:
    - `FetchedItemData` または `LocalError`
- 補助取得3 API は backend 実装が必要であり、admin-front 単体では成立しない。

4. フォームバリデーション契約（`achievementCreator`）
- `achievementURL`:
  - `required`
  - `CHARACTER_REGEXP` に一致
- `title`, `description`, `point`:
  - `required`
- `iconUrl`:
  - `iconPath` 未設定時のみ `required`
  - `ICON_REGEXP` に一致
- `titleAward`:
  - 共通称号時に `required`
- `titleAwardMan` / `titleAwardWoman`:
  - 男女別称号時に `required`
- `itemAwardUrl`:
  - アイテム報酬ONかつ itemAward 未設定時に `required`
  - `LOADSTONE_REGEXP` に一致

5. 新規アチーブメント生成契約（`createInputAchievement`）
- 作成時の基本初期値:
  - `isCreated: true`
  - `isEdited: true`
  - `isNowCreated: true`
  - `sourceIndex: -1`
  - `tagIds: []`
  - `patchId: 0`
  - `adjustmentPatchId: 0`
- 称号報酬・アイテム報酬はトグル状態に応じて条件付与する。

6. 並び替え契約
- 未分類（ungroup）および分類済み（group.data）ともに `sourceIndex` でソート。
- `sourceIndex = -1` は末尾へ送る。

7. タグID強制更新契約（`/tag`）
- `isForceTagUpdate` が ON の場合のみ実行。
- 挿入時:
  - 追加位置以上の tagId を +1 する。
  - アチーブメント側 tagIds も +1 追従。
- 削除時:
  - 削除IDを参照する tagId を除外。
  - それより大きい tagId を -1 する。
- ネストタグ削除時:
  - 子タグは親から外してトップに戻す処理が入る。

8. パッチID強制更新契約（`/patch`）
- `isForcePatchUpdate` が ON の場合のみ実行。
- 挿入時:
  - 追加位置以上の patchId を +1。
  - アチーブメント側 `patchId` / `adjustmentPatchId` も +1 追従。
- 削除時:
  - 削除IDを参照する値は 0 にクリア。
  - それより大きい値は -1 する。

9. 差分検知契約
- `itemsEditor`:
  - カテゴリ単位差分を `deep-object-diff` で管理し、保存ボタンの活性に反映。
- `/tag`・`/patch`:
  - 編集データと基準データの差分で `isUpdated` を制御。
  - 強制ID更新時は `isAchievementUpdated` も更新。

10. エラー契約
- API 失敗時は `LocalError` 判定または例外キャッチし、`OUTPUT_SNACKBAR` で通知する。
- 保存失敗時の代表キー:
  - `post_firebase_error`
  - `group_not_found_by_key`

11. 既知の外部依存（要参照）
- 型/変換ロジックの詳細は以下外部依存に定義される。
  - `@murofush/forfan-common-package`
  - `@murofush/forfan-common-vue`
- 旧実装の API エンドポイント実装は本リポジトリ内で確認できない箇所があるため、再実装時はこの契約を基準に安全設計を行う。
- 旧 `forfan-common-package` の履歴上、`getEditAchievementDataFromCloudStorage`（旧名）/`getEditAchievementKindFromCloudStorage`（新名）で Cloud Storage 取得を実装していたことを確認済み。

## 受け入れ条件

- React 実装で API 呼び出しパス・params・成功/失敗分岐が同等である。
- タグ/パッチID強制更新時の追従ロジックが同等である。
- バリデーション条件が旧実装と同じ有効化条件で動作する。

## 非ゴール

- 旧実装が依存する外部パッケージ型の再定義。
- 旧エンドポイント実装のセキュリティ方針自体の決定（別途セキュア設計で扱う）。

## 影響範囲

- Front: `components/achievementCreator.vue`, `components/itemsEditor.vue`, `pages/tag.vue`, `pages/patch.vue`
- Back: `/api/*` 契約再定義時の互換基準
- Domain: ID再採番・保存整合ルール
- Docs: 本仕様、同等チェックリスト

## 既存挙動との差分

- なし（本仕様は旧実装コード上の契約を文書化したもの）。

## 移行/互換方針

- API 名称/レスポンス構造を変更する場合は、互換レイヤーを設けるか仕様変更承認を先行する。
- UI 改修時も、データ更新規則（特に強制ID更新）は同等維持する。

## 関連リンク

- `docs/spec/achievement-editor-product-charter.md`
- `docs/spec/achievement-editor-legacy-screen-responsibilities.md`
- `docs/spec/achievement-editor-functional-equivalence-checklist.md`
- `apps/achievement-editor/components/achievementCreator.vue`
- `apps/achievement-editor/components/itemsEditor.vue`
- `apps/achievement-editor/pages/tag.vue`
- `apps/achievement-editor/pages/patch.vue`
- `apps/achievement-editor/store/`
