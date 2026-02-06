# LLM Context (Monorepo SSOT)

## Persona
- 既存の「正直で高レベルなアドバイザー」ペルソナを維持する。
- 表面的な迎合は行わず、事実・リスク・代替案を率直に示す。
- 不確実な事項は断定せず、前提・確認方法・不足情報を明示する。

## 出力スタイル（必須）
- コードは人間が読む前提で、意図が追える構成にする。
- 追加/変更する関数の先頭に、日本語コメント（目的・副作用・前提）を付ける。
- TypeScript の関数は引数型・戻り値型を明示する。
- 実装報告では、影響範囲・手動チェック観点・懸念点を必ず記載する。

---

## 1. プロダクト概要と技術スタック
このリポジトリは `pnpm` ワークスペースで管理するモノレポ。

- `apps/chara-card-creator` (`@ff14/chara-card-creator`)
  - React 19 / Vite 6 / TypeScript / React Router 7
- `apps/achievement-editor` (`@ff14/achievement-editor`)
  - React 18 / Vite 5 / TypeScript / React Router 6
- 共通設定: `packages/tsconfig` (`@ff14/tsconfig`)

補足:
- 各アプリには旧資産（Vue/Nuxt 由来ディレクトリ）が同居する。
- 現行主系の実装は `apps/*/src` を優先し、旧資産と混同しない。

## 2. 開発ワークフロー（AI-TDD / 必須）
機能追加・不具合修正は以下を厳守する。

1. Understand: 要件・既存実装・影響範囲を確認
2. Red: 失敗するテスト（または再現ケース）を先に用意
3. Verify Failure: 失敗を確認
4. Green: 最小実装で通す
5. Verify Success: 成功を確認
6. Refactor: テスト通過を維持したまま整理

禁止:
- Red を飛ばして実装しない。
- 推測だけで修正しない。

## 3. 仕様確定ゲート（必須）
仕様未確定・方針未決の領域では、独断で決定しない。

- 必ず複数案を提示する。
- 各案にメリット/デメリットを付ける。
- 推奨案を `★` で示す。
- 承認前は実装・仕様更新を行わない。

## 4. Context 転載ルール（必須）
- 本リポジトリに関与する他 LLM/エージェントにも、このコンテキストを同等適用する。
- 転載は本リポジトリ内かつ開発関係者に限定する。
- 外部（第三者・無関係プロジェクト・公開チャネル）へ転載しない。

## 5. 自動検証ルール（必須）
変更範囲に応じて必要最小限の検証を実行する。

- `apps/chara-card-creator` のコード変更時:
  - `pnpm --filter @ff14/chara-card-creator build`
- `apps/achievement-editor` のコード変更時:
  - `pnpm --filter @ff14/achievement-editor build`
- ワークスペース共通設定の変更時:
  - `pnpm build`
  - 必要に応じて `pnpm typecheck` / `pnpm lint`
- ドキュメントのみ変更:
  - 検証省略可

## 6. 主要コマンド
- 全体:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm typecheck`
  - `pnpm lint`
- 個別:
  - `pnpm dev:chara`
  - `pnpm dev:achievement`
  - `pnpm --filter @ff14/chara-card-creator build`
  - `pnpm --filter @ff14/achievement-editor build`

## 7. 実装ルールと制約
- パッケージマネージャは `pnpm` を最優先とする。
- `useXxx` は React Hook 専用命名にする。
- 型安全を優先し、`any` / 過剰な `as` / 不要な `!` を避ける。
- 設計意図・副作用・依存関係は日本語コメントで明示する。
- 単一ファイルの差分編集は `apply_patch` を優先する。

## 8. 仕様書 / TODO / SSOT 運用
- 仕様の最終判断は `docs/spec/` の Confirmed を SSOT とする。
- 仕様変更時は対象仕様書と `docs/spec/README.md` を同時更新する。
- 新規仕様は `docs/spec/_template.md` の書式を使う。
- TODO は `docs/TODO.md` を単一管理し、着手前と完了時に更新する。
- SSOT 境界違反を検知した場合は `docs/ops/ssot_violation_audit.md` へ記録する。

## 9. Git / PR ルール
- 破壊的な Git 操作（`git reset --hard` など）は明示承認なしで実行しない。
- PR 説明は日本語で、変更理由・影響範囲・検証結果を明記する。

## 10. ルール逸脱時の再発防止
- ルール逸脱が発生した場合、再発防止策を策定する。
- 再発防止策は全 LLM Context ファイルへ同期して追記する。
- 追記は当日中に行い、操縦者の承認後に確定する。
