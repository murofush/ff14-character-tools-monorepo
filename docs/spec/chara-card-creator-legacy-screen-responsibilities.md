# Chara Card Creator 旧実装 画面責務仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-12

## 目的/背景

- `chara-card-creator` を段階移行する際に、旧 Vue/Nuxt 実装の画面責務を正確に再現するための基準を定義する。
- 見た目変更は許容するが、画面が担う機能責務と遷移責務は維持する。

## 仕様

1. 共通レイアウト責務（`layouts/default.vue`）
- ヘッダに以下導線を表示する。
  - キャラクター選択（`/`）
  - アチーブメント選択（`/selectAchievement`）
  - 名刺デザイン編集（`/editCharaCard`）
- キャラクター取得後は、キャラクター概要メニュー（名前/種族/FC/DC/ジョブ一覧）を表示する。
- 全画面共通スナックバー（`OUTPUT_SNACKBAR`）を表示・制御する。
- フッタに問い合わせフォームと `/about` 導線を表示する。

2. ルーティング責務
- 旧実装で責務を持つルート:
  - `/`
  - `/selectAchievement`
  - `/editCharaCard`
  - `/about`
- `/editCharaCard` 直アクセスはミドルウェアで制御し、選択フロー未完了時の不整合遷移を抑止する。

3. Home（`pages/index.vue`）責務
- `editCharaSelector` を通じて Lodestone URL/ID 入力と取得実行を行う。
- 取得済みキャラクター（localStorage復元）から再開できる。
- 「つかいかた」説明と Lodestone 公開設定の注意を表示する。
- 正常取得時に Achievement 同期処理を行い、`/selectAchievement` へ遷移する。

4. アチーブメント選択画面（`pages/selectAchievement.vue`）責務
- `checkFetchedMiddleware` によりキャラクター未取得時は `/` へ戻す。
- `editAchievementSelector` でカテゴリタブ・カテゴリ一覧・グループ一覧を提供する。
- `selectedAchievementViewer` で選択済み一覧（件数/上限4件）を表示する。
- 次画面（`/editCharaCard`）遷移導線と戻る導線を提供する。

5. `editAchievementSelector` / `achievementCategoryList` 責務
- `KIND` に沿ったカテゴリタブを表示する。
- カテゴリごとに group を展開し、アチーブメントカード一覧を表示する。
- PCでは右サイドにグループナビ、モバイルではドロワーを提供する。
- 未取得カテゴリは遅延取得し、取得失敗時は再取得導線を提供する。

6. `achievementCard` / 選択操作責務
- `isCompleted=false` の項目は選択不可にする。
- 選択時は `SelectedCharaInfoStore` に index path を追加する。
- 解除時は同 index path を削除する。
- 上限（4件）や重複選択時はエラー通知を返す。

7. カード編集画面（`pages/editCharaCard.vue` + `components/characterCard/*`）責務
- `charaCardCanvas` でプレビュー描画を行う。
- `charaCardSettings` で以下を編集する。
  - メイン画像アップロードとトリミング
  - 画像レイアウト（9:16 / 16:9、左右配置、表示範囲、情報領域透過）
  - 紹介文
  - テーマ/配色（文字・背景・強調）
  - フォント（名前/全体/英数字専用）
  - 強調表示条件（緩和前取得アチーブメント）
- 保存操作で PNG 画像をクライアントにダウンロードする。

8. About（`pages/about.vue`）責務
- サイト概要・プライバシー情報を表示する。
- `/` へ戻る導線を提供する。

9. ミドルウェア/ガード責務
- `mixins/checkFetchedMiddleware.ts`:
  - キャラクターデータ未復元時に `/` へリダイレクトする。
- `middleware/checkSelectedMiddleware.ts`:
  - `editCharaCard` 直アクセスを抑止し、`/selectAchievement` に戻す。

## 受け入れ条件

- React 移行後、上記ルートと画面責務が 1:1 で説明できる。
- 選択フロー（取得→選択→編集→保存）が中断なく動作する。
- 選択制約（上限・重複）とガード遷移が再現される。

## 非ゴール

- Vuetify 由来レイアウト/DOM の完全一致。
- 旧アニメーションや見た目装飾の完全複製。

## 影響範囲

- Front: `apps/chara-card-creator/pages`, `layouts`, `components`。
- Domain: 選択フローとカード編集フローの責務境界。
- Docs: 本仕様、チェックリスト、移行仕様。

## 既存挙動との差分

- なし（本仕様は旧実装コードから責務を抽出したもの）。

## 移行/互換方針

- 画面責務は同等維持、UI見た目は変更許容。
- コンポーネント再分割しても、操作結果・状態遷移・保存結果は同等に保つ。

## 関連リンク

- `docs/spec/chara-card-creator-product-charter.md`
- `docs/spec/chara-card-creator-legacy-api-data-contract.md`
- `docs/spec/chara-card-creator-functional-equivalence-checklist.md`
- `apps/chara-card-creator/layouts/default.vue`
- `apps/chara-card-creator/pages/index.vue`
- `apps/chara-card-creator/pages/selectAchievement.vue`
- `apps/chara-card-creator/pages/editCharaCard.vue`
- `apps/chara-card-creator/pages/about.vue`
