# Chara Card Creator 旧実装 API・データ契約仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-12

## 目的/背景

- 旧 Vue/Nuxt 実装が依存していた API・ストア・データ契約を固定し、React 移行時の機能乖離を防ぐ。
- 本仕様は「旧呼び出しコードから抽出した契約」を SSOT とする。

## 仕様

1. データ取得境界（read）
- Tag/Patch/編集済みAchievement系データは Cloud Storage 公開データを参照する。
- 旧実装参照:
  - `store/tag.ts`: `getTagDataFromCloudStorage`
  - `store/patch.ts`: `getPatchDataFromCloudStorage`
  - `store/achievement.ts`: `getCompletedAchievementKindFromCloudStorage`, `getCompletedAchievementCategoryFromCloudStorage`
- `nuxtServerInit` で Tag/Patch/Achievement の初期化を行う。

2. キャラクター取得 API 契約（`GET /api/get_character_info`）
- 実装参照: `apps/chara-card-creator/api/index.ts`
- Query:
  - `url`（必須）
- 検証:
  - Lodestone character URL 正規表現に一致すること。
  - または URL 由来の character ID が数値で解釈可能なこと。
- 正常レスポンス:
  - `ResponseData`
    - `characterID: number`
    - `fetchedDate: Date`
    - `characterData: CharacterInfo`
    - `completedAchievementsKinds: CompletedAchievementsKind[]`
    - `isAchievementPrivate: boolean`
    - `freecompanyInfo?: FreecompanyPositionInfo & FreecompanyInfo`
- エラーレスポンス:
  - `LocalError` 形式（`key`, `value`）
  - 400: 入力不正・Lodestone取得失敗・FC取得失敗等
  - 500: 予期しない例外

3. Lodestone スクレイピング契約
- `api/character.ts`:
  - キャラクター基本情報、所属ワールド/DC、種族/部族/性別、ジョブレベル、FC/PvP 情報、自己紹介文を抽出する。
- `api/achievement.ts`:
  - achievement kind 単位で完了実績（タイトル、完了日時）を抽出する。
  - private ページ時は `PRIVATE_ACHIEVEMENT` を返却する。
- `api/freecompany.ts`:
  - FC 情報・所属役職情報を抽出する。
- 注意:
  - Lodestone DOM 構造依存であり、DOM変更時は抽出ロジック更新が必要。

4. クライアント保持契約（CharacterInfoStore）
- `ResponseData` は localStorage（key: `characterData`）へ暗号化保存する。
- 暗号鍵は `process.env.ENCRYPT_KEY` を使用する。
- 復元時は `isResponseCharacterData` で型検証し、不正時は破棄する。
- `setResponseCharacterData` 時に以下副作用を行う。
  - `SelectedCharaInfoStore.description` を自己紹介文へ同期
  - 完了実績から最古達成日 `oldestAchievementDate` を再計算

5. 実績同期契約（CharacterInfoStore → AchievementStore）
- `syncAchievements` は CompletedAchievement と編集済みAchievementをタイトル一致で突合する。
- 一致時に `completedDate` と `isCompleted=true` を更新する。
- Category単位同期（`syncAchievementCategoryById`）と Kind単位同期（`syncAchievementKindByKey`）を提供する。

6. 選択状態契約（SelectedCharaInfoStore）
- 選択項目は `AchievementIndexPath` で保持する。
- 1項目の識別キー:
  - `kindIndex`, `categoryIndex`, `groupIndex`, `achievementIndex`
- 制約:
  - 最大選択数は `maxAchievementCount=4`
  - 同一 index path の重複選択は禁止
- エラーは `LocalError` で返却する。

7. カード編集状態契約（SelectedCharaInfoStore）
- テーマ:
  - `light` / `dark`
  - 配色上書き可能（`isCardColorChangeable`）
- テキスト:
  - 紹介文、フォント、太字フラグ
- 画像:
  - `isFullSizeImage` 切替で 9:16 / 16:9 レイアウトを切替
  - 画像は `sideMainImage` / `fullMainImage` を分離保持
  - `widthSpace` で全画面パターンの表示範囲を調整
- 追加表示:
  - 緩和前取得実績の強調表示制御（`disabledBeforeUnlockAccent`）

8. 画像トリミング契約
- `imageCropperCard` は `cropRatio` に応じたトリミングを行う。
- 適用時は `HTMLImageElement` を返却し、`SelectedCharaInfoStore.setMainImage` へ反映する。
- 失敗時は `OUTPUT_SNACKBAR` でエラー通知する。

9. 画像出力契約
- `charaCardCanvas.saveImage` は PNG の DataURL を Blob 化してダウンロードする。
- 出力ファイル名は固定 `chara_card.png`。
- メイン画像未設定時は保存を拒否し、エラー通知する。

10. ルートガード契約
- `checkFetchedMiddleware`:
  - CharacterInfo 未取得時に `/` へ戻す。
- `checkSelectedMiddleware`:
  - `editCharaCard` 直アクセス時に `/selectAchievement` へ戻す。

## 受け入れ条件

- 旧実装の read/write 境界と主要データ型が仕様書だけで追える。
- 取得・同期・選択・編集・保存の副作用が明記されている。
- React 移行時に、契約差分を仕様差分として判定できる。

## 非ゴール

- Lodestone DOM 仕様そのものの安定保証。
- 旧 API 実装の運用基盤（ホスティング、監視）の確定。

## 影響範囲

- Front: `apps/chara-card-creator/store`, `components`, `mixins`, `middleware`。
- Back: `apps/chara-card-creator/api/*` 互換。
- Domain: `ResponseData`, `AchievementIndexPath`, カード設定モデル。
- Infra: localStorage 暗号化キー運用。
- Docs: 本仕様、チェックリスト、移行仕様。

## 既存挙動との差分

- なし（旧実装コードから契約を抽出したもの）。

## 移行/互換方針

- 互換層を挟んでも、入出力契約と副作用契約は維持する。
- 仕様変更が必要な場合は、先に本仕様を更新してから実装する。

## 関連リンク

- `docs/spec/chara-card-creator-product-charter.md`
- `docs/spec/chara-card-creator-legacy-screen-responsibilities.md`
- `docs/spec/chara-card-creator-functional-equivalence-checklist.md`
- `docs/spec/chara-card-backend-api-spec.md`
- `docs/spec/monorepo-api-ownership-and-routing.md`
- `apps/chara-card-creator/api/index.ts`
- `apps/chara-card-creator/api/character.ts`
- `apps/chara-card-creator/api/achievement.ts`
- `apps/chara-card-creator/api/freecompany.ts`
- `apps/chara-card-creator/store/characterInfo.ts`
- `apps/chara-card-creator/store/selectedCharaInfo.ts`
