# Chara Card Creator プロダクト定義（旧実装SSOT）

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-12

## 目的/背景

- `chara-card-creator` は FF14 プレイヤーの Lodestone 情報を起点に、SNS 共有向けのキャラカード画像を作成するためのプロダクトである。
- 現在は React 実装（`src/`）と旧 Vue/Nuxt 実装が同居している。
- 以降の移行では、**旧 Vue 実装の機能責務を SSOT（唯一の真実）** とし、機能面の乖離を許容しない。

## 仕様

1. Product Charter（何を実現するか）
- 対象ユーザー:
  - FF14 のキャラクター情報から、短時間で見栄えのある自己紹介カードを作りたいプレイヤー。
- 解決する課題:
  - キャラクター情報・実績情報・画像編集を跨ぐ手作業を削減する。
- 提供価値:
  - 入力（Lodestone URL/ID）→ アチーブメント選択 → カード編集 → 画像保存の一連フローを単一UIで完結できる。

2. IA / 画面責務（旧実装基準）
- `/`:
  - Lodestone URL/ID の入力検証とキャラクター取得を行う。
  - 直近取得キャラクターから再開できる。
- `/selectAchievement`:
  - 取得済みアチーブメントをカテゴリ/グループで閲覧し、カード掲載対象を選択する。
- `/editCharaCard`:
  - メイン画像、配色、フォント、紹介文、表示レイアウトを編集し、PNG保存する。
- `/about`:
  - サイト概要・注意事項を表示する。

3. データロード・保存仕様
- 初期ロード:
  - `nuxtServerInit` で Tag/Patch/Achievement 基本データを読み込む。
  - 読み込みは Cloud Storage 公開データ参照を前提とする。
- キャラクター取得:
  - `/api/get_character_info` で Lodestone 由来のキャラクター情報・達成実績を取得する。
- クライアント保持:
  - 取得済み `ResponseData` は localStorage に暗号化保存し、再訪時に復元する。
- 出力:
  - カード画像はクライアント側で `chara_card.png` として保存する（サーバ永続化なし）。

4. 機能スコープ
- Must（成立条件）:
  - Lodestone URL/ID 入力検証と取得。
  - 達成済みアチーブメントの選択/解除（上限4件）。
  - カード編集（画像、配色、フォント、説明文、レイアウト）。
  - カード画像（PNG）保存。
  - 共通スナックバー通知。
- Should（改善余地）:
  - UI/コード構造の改善（Feature First 化、型強化）。
  - エラー分類や表示文言の整理。
- Out（対象外）:
  - サーバサイドでのカード保存・ユーザーアカウント管理。
  - `achievement-editor` の運用機能統合。

5. SSOT適用ルール（乖離禁止）
- 旧 Vue/Nuxt 実装を仕様基準として扱う。
- React へ移す際は、旧実装と同等であることをテストまたは再現手順で確認する。
- 仕様差分を入れる場合は、仕様書更新と承認を先行する。

## 受け入れ条件

- `chara-card-creator` の機能判断で、旧実装の責務を根拠付きで説明できる。
- React 実装タスクごとに、旧実装との同等性確認観点が提示される。
- 機能追加や仕様変更時に、事前に仕様更新が行われる。

## 非ゴール

- 旧 Vuetify UI の見た目・DOM 完全一致。
- 旧コード構造のコピー。
- 段階移行前の旧資産一括削除。

## 影響範囲

- Front: `apps/chara-card-creator` の画面責務と移行判定基準。
- Back: `/api/get_character_info` 契約の互換維持。
- Domain: キャラクター情報・選択実績・カード設定のデータ境界。
- Infra: 既存ビルド検証運用への直接影響なし（Docs更新のみ）。
- Docs: 本仕様、索引、チェックリスト、TODO。

## 既存挙動との差分

- 旧版の Charter は Draft で抽象度が高く、旧実装SSOTの拘束力が弱かった。
- 本版では SSOT を明示し、移行判断を機能同等ベースに固定した。

## 移行/互換方針

- 互換期間中は旧 URL（`/selectAchievement`, `/editCharaCard`）互換を維持する。
- 機能単位で同等性検証が完了するまで、旧実装の該当責務を削除しない。
- UI変更は許容するが、操作結果・保存結果・副作用は同等維持する。

## 関連リンク

- `docs/spec/README.md`
- `docs/spec/chara-card-creator-react-staged-migration.md`
- `docs/spec/chara-card-creator-legacy-screen-responsibilities.md`
- `docs/spec/chara-card-creator-legacy-api-data-contract.md`
- `docs/spec/chara-card-creator-functional-equivalence-checklist.md`
- `apps/chara-card-creator/layouts/default.vue`
- `apps/chara-card-creator/pages/`
- `apps/chara-card-creator/components/`
- `apps/chara-card-creator/store/`
