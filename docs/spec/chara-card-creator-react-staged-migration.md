# Chara Card Creator React段階移行仕様

## ステータス

- 状態: Draft
- 決定日: 2026-02-06

## 目的/背景

- `apps/chara-card-creator` には React 実装（`src/`）と Vue/Nuxt 旧実装が同居している。
- 旧実装の一括削除を先行すると、機能移植前に挙動が欠落するリスクが高い。
- 本仕様は「機能同等を確認した単位だけ旧実装を削除する」段階移行の基準を定義する。

## 仕様

1. 移行方針
- 方針は段階移行（Strangler Pattern）とする。
- Vue/Nuxt 資産は、対応する React 実装の受け入れ条件を満たすまで削除しない。

2. 対象範囲
- 対象アプリは `apps/chara-card-creator` のみ。
- 現行 React 実装は `apps/chara-card-creator/src` を主系とする。
- 旧資産（例: `components/`, `pages/`, `store/`, `plugins/`, `api/`）は移行完了まで参照可能状態を維持する。

3. 機能単位の移行手順
- 各機能は AI-TDD で進める（Understand → Red → Verify Failure → Green → Verify Success → Refactor）。
- 機能ごとに「旧実装と同等であること」をテストまたは再現手順で証明する。
- 同等確認後に、その機能に紐づく Vue/Nuxt ファイルを削除する。

4. ルーティング移行基準
- 旧ルート互換を維持する（例: `/editCharaCard` から `/edit-chara-card` への遷移保証）。
- React Router 側でリダイレクトまたは同等ルートを提供する。

5. セキュリティ移行基準
- Secret（APIキー/秘密鍵/トークン）の直書きを禁止する。
- 移行途中で検出した Secret は即時に環境変数化し、必要に応じて失効・ローテーションする。

## 受け入れ条件

- 機能同等チェックリストで、対象機能が「移行済み」かつ「手動確認済み」になっている。
- `pnpm --filter @ff14/chara-card-creator build` が成功する。
- 機能移行が完了した最終段階で、`apps/chara-card-creator` 配下に Vue/Nuxt 実装ファイル（`.vue`, `@nuxt/*` 依存）が残っていない。
- 機密情報がリポジトリに平文で残っていない。

## 非ゴール

- UI/UX の全面刷新。
- 既存要件にない新規機能追加。
- `apps/achievement-editor` の同時移行。

## 影響範囲

- Front: `apps/chara-card-creator/src` の React 実装拡張、旧 Vue コンポーネントからの段階移行。
- Back: 必要時のみ `apps/chara-card-creator` 内旧 API ロジックの移植または代替。
- Domain: キャラクター情報/アチーブメント情報の取得・加工ロジック。
- Infra: ビルド/CI の検証観点追加（移行チェック）。
- Docs: 本仕様、仕様索引、TODO の継続更新。

## 既存挙動との差分

- 既存: React 側は基盤ルーティング中心で、旧 Vue 実装に機能が残っている。
- 移行後: React 側で同等機能を提供し、対応する Vue 資産を段階的に削除する。

## 移行/互換方針

- 互換期間中は旧 URL を React 側で吸収する。
- 破壊的変更は機能単位で実施し、各ステップでロールバック可能な粒度を維持する。
- 旧資産の削除は「同等性検証完了」を前提条件とする。

## 関連リンク

- `docs/spec/README.md`
- `docs/TODO.md`
- `apps/chara-card-creator/src/app/App.tsx`
- `apps/chara-card-creator/AGENTS.md`
