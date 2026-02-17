# Chara Card Creator 段階移行仕様（旧Vue→現行Web）

## ステータス

- 状態: Draft
- 決定日: 2026-02-12

## 目的/背景

- `apps/chara-card-creator` は現状、現行実装（`src/`）と旧 Vue/Nuxt 実装が同居している。
- 旧実装の機能責務は維持しつつ、段階移行で安全に置換するための実行手順を固定する。

## 仕様

1. 移行原則
- 旧実装は SSOT とし、機能乖離を許容しない。
- AI-TDD（Understand → Red → Verify Failure → Green → Verify Success → Refactor）を機能単位で適用する。
- 同等性未確認の機能に紐づく旧資産は削除しない。

2. 対象範囲
- 対象アプリ: `apps/chara-card-creator`
- 現行主系: `apps/chara-card-creator/src`
- 旧資産（`pages/`, `components/`, `store/`, `api/`, `layouts/`, `mixins/`, `middleware/`）は移行完了まで参照可能状態を維持する。

3. 移行フェーズ
- Phase 1（完了済）:
  - React基盤ルーティング整備
  - Home入力導線の移植
  - 互換ルート（旧URL→新URL）導線維持
- Phase 2（進行中）:
  - `/select-achievement` 旧責務の完全移植（完了）
  - `/edit-chara-card` 旧責務の完全移植（基礎責務は移植済、旧Canvas同等描画は継続）
  - 旧レイアウト責務（共通通知/ヘッダ操作）の同等移植
- Phase 3（未着手）:
  - 同等性チェック完了後の旧Vue資産削除
  - 不要依存（Nuxt/Vuex/Vuetify）段階削除

4. 移行完了定義
- `docs/spec/chara-card-creator-functional-equivalence-checklist.md` の Must 項目がすべて `手動確認済`。
- `pnpm --filter @ff14/chara-card-creator build` が成功する。
- 旧資産由来の未移植責務が残っていないことを仕様/実装の両方で説明できる。

5. セキュリティ/運用原則
- Secret（APIキー/トークン/秘密鍵）の直書きを禁止し、環境変数化する。
- 旧資産で検出した Secret は失効・ローテーション計画と合わせて対応する。

## 受け入れ条件

- フェーズごとの完了判定が仕様書上で追える。
- 機能単位の移行時に「どの責務をどのテストで担保したか」を説明できる。
- 同等性未確認機能の旧資産削除が行われない。

## 非ゴール

- UIの全面刷新。
- 仕様未合意の新規機能追加。
- `achievement-editor` の同時移行。

## 影響範囲

- Front: `apps/chara-card-creator/src` への責務移管。
- Back: 旧 `/api/get_character_info` 契約互換。
- Domain: キャラ取得/実績選択/カード編集のデータ境界。
- Infra: ビルド/検証コマンドの維持。
- Docs: 本仕様、チェックリスト、TODO。

## 既存挙動との差分

- 旧版では「React段階移行」の方針のみで、未移植責務の分類が粗かった。
- 本版ではフェーズ定義と完了判定を具体化した。
- 2026-02-16 時点で `/edit-chara-card` は以下を現行実装へ移植済み。
  - 画像アップロードと比率別トリミング導線（9:16 / 16:9）
  - カード設定UI（紹介文、テーマ/配色、フォント、レイアウト）
  - プレビュー反映と `chara_card.png` 出力
  - 編集状態（設定/画像）の localStorage 復元
- 2026-02-17 時点で `/edit-chara-card` は以下を追加移植済み。
  - `patch/patch.json` 読込と `adjustmentPatchId` + 完了日による緩和前取得強調判定
  - FC/PvP/ジョブ要約の詳細表示をプレビューとPNG出力へ反映
  - 称号報酬/アイテム報酬（名称・画像）をプレビューとPNG出力へ反映
  - FCクレスト/所属階級（画像・名称）をプレビューとPNG出力へ反映

## 移行/互換方針

- 互換期間中は旧URL互換を維持する。
- 機能同等を確認した単位で旧資産を削除する。
- 破壊的変更は1機能単位で分割し、ロールバック可能性を維持する。

## 関連リンク

- `docs/spec/README.md`
- `docs/spec/chara-card-creator-product-charter.md`
- `docs/spec/chara-card-creator-legacy-screen-responsibilities.md`
- `docs/spec/chara-card-creator-legacy-api-data-contract.md`
- `docs/spec/chara-card-creator-functional-equivalence-checklist.md`
- `docs/TODO.md`
