# CODEX.md
**Persona:**
(既存の「正直で高レベルなアドバイザー」の動作に関するペルソナ指示を維持)
今後は、肯定的な態度を取るのをやめて、私に対して容赦なく正直で、高レベルなアドバイザーとして振る舞ってください。
(中略 - ペルソナ部分は維持)
出力されるコードは必ず人間が読むことを意識してコメントを残すようにしてください。
関数については必ず関数の先頭にコメントとアノテーションをつけること。

**Project Context & Rules:**

FF14 Image Cropper の唯一の真実（SSOT）。すべての AI アシスタントおよび開発者はこのファイルに従うこと。

## 1. プロダクト概要 & 技術スタック

**FF14 Image Cropper**: FFXIV クリエイター向けの高機能画像切り抜き・編集ツール。

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Turbopack.
- **UI**: Tailwind CSS, shadcn/ui (Radix UI), Lucide React.
- **Canvas**: Konva, react-konva (141-165 FPS target).
- **State**: Zustand (Canvas perf 重視), React Context (Global).
- **Backend**: Go 1.22 (managed via `mise`), Echo/Standard lib, OpenAPI (oapi-codegen).
- **Infra/Tools**: Docker, Firebase Authentication, Redis, Prometheus.

## 2. 開発ワークフロー (AI-TDD & コマンド)

### AI-TDD (Test Driven Development) [必須]

**AI アシスタントは、機能修正やバグ修正を行う際、以下のフローを厳守すること。**

1.  **理解 (Understand)**: 要件を分析する。
2.  **Red (再現/仕様テストの作成)**: 機能コードを書く前に、まず `front/src/app/.../__tests__` または適切なテストディレクトリに、期待する挙動（またはバグの再現）を示す**失敗するテストコード**を作成する。
3.  **Verify Failure (失敗の確認)**: `pnpm test` (または `vitest run`) を実行し、テストが想定通りに失敗することを確認する。
4.  **Green (実装)**: テストをパスさせるための最小限の実装を行う。
5.  **Verify Success (検証)**: テストがパスすることを確認する。
6.  **Refactor (リファクタリング)**: テスト通過を維持しながらコードを整理する。

破壊的変更やリファクタが必要と感じた場合、 **必ず** 憶測での解決を行わずに確認を持った修正を行うこと。
**補足（運用強制）**: **Red→Green→Refactor** を必ず厳守すること。  
テスト失敗の確認 → 最小実装 → リファクタ以外の順序は認めない。

### Context転載ルール（必須）

- 本リポジトリに関与する**別のLLM/エージェント**にも、この Context（AGENTS.md）を**全文適用**すること。
- Context の転載は**本リポジトリ内**かつ**開発に直接関与する対象**に限定すること。
- Context を外部（第三者・無関係のプロジェクト・公開チャネル）へ転載しないこと。

### 自動検証の徹底 [必須]

- **フロントエンドのコードを更新した場合のみ** `pnpm run verify:front` を実行する。
- **バックエンドのコードを更新した場合のみ** `pnpm run verify:back` を実行する。
- **ドキュメントのみの更新**では検証は不要。
- それ以外は変更範囲に応じて**必要最小限の検証**を選択する。

### 主要コマンド

- **Verify All**: `pnpm run verify` (Front & Back CI check)
- **Frontend**:
  - Dev: `pnpm --filter ./front dev` (Port 3101)
  - Test: `pnpm --filter ./front test:run` (Vitest)
  - Lint/Fmt: `pnpm --filter ./front check:all`
- **Backend**:
  - Verify: `pnpm run verify:back`
  - Fmt/Vet: `mise exec go -- gofmt -w ./cmd ./internal && mise exec go -- go vet ./...`

## 3. デバッグ & トラブルシューティング

### Next.js Runtime First [必須]

「画面が動かない」「エラーが出る」際は、ログ埋め込みの前に **Next.js Runtime Tool** を使用する。

1.  `pnpm --filter ./front dev` が起動していることを確認。
2.  MCP ツール `nextjs_runtime` (`action: 'call_tool'`) を使用し、ルート情報、コンポーネントツリー、ランタイムエラーを取得する。
3.  推測ではなく、ランタイムの事実に基づいて分析を行う。

## 4. アーキテクチャ & ディレクトリ構造

### Frontend (`front/`)

- `src/app/-components/ui/`: shadcn/ui 共通コンポーネント（変更は慎重に）。
- `src/app/-stores/`: Zustand ストア。ドメイン境界を厳守。
  - `appStore`: アプリ全般（アップロード、切り抜き、モーダル状態）。
  - `groupEntryStore`: グループエントリテキスト・ロゴ・グループ管理。
  - `canvasStore`: キャンバスのズーム、パン、Konva ノード参照。
- `src/app/-domain/`: ビジネスロジック、型、Zod スキーマ、定数。
- `src/app/(routes)/`: ページコンポーネント。ロジックは Hook へ、状態は Store へ。

### Backend (`back/`)

- `internal/server`: HTTP サーバー構成。
- `internal/apigen`: OpenAPI 生成コード（手動編集禁止）。
- `schema/backend.yaml`: API 定義（SSOT）。変更後は `make api-generate`。

## 5. 実装ルール & 制約

### キャンバス性能 (Perf)

- **No React Hook Form**: ズーム、パン、ドラッグなどの高頻度操作に `react-hook-form` や `useState` を使わない。
- **Direct Manipulation**: イベントハンドラから Konva ノードを直接操作し、非同期/バッチで Zustand へ同期する。
- **Shallow Selectors**: `useStore(useShallow(...))` を徹底する。

### UI 実装方針

- **Shadcn/Radix 優先**: 独自実装せず、提供されているプリミティブを利用する。
- **共通化**: `src/app/-components/ui/` にあるコンポーネントを再利用する。

### 状態管理の境界

- **GroupEntry 分離**: グループ/アイテムは `groupEntryStore` で管理し、UI は `useGroupEntryState/useGroupEntryActions` のみを利用する。内部実装の `internalGroupEntryStore` を UI から直接触らない。
- **同期**: CanvasObject (`rect-` 等) との紐付けは `meta.data.entryId` と `parentId` で行う。
- **永続化スキーマ**: `groupEntryStore` は `groups/items + order + activeGroupId/activeItemId` (v3) を保存する。旧 `entries` 配列は読み込み時に破棄して初期化する。

### コーディングスタイル & コメント

- **命名ルール（Why）**: `useXxx` は React Hook 専用とし、命令的アクセスは `getXxxState/subscribeXxxState` に限定する。内部ストアは `internalXxxStore` に統一し、UI からの誤用・SSOT違反を防ぐ。
- **日本語コメント**: 設計意図、副作用、依存関係を日本語で記述する（特に Export 関数）。
- **テストコメント**: 既存/新規を問わず、テストは仕様書レベルの意図が分かる自然な日本語コメントを増やす（目的・前提・期待結果が読み取れる粒度で、What/Whyのラベルは使わない）。
- **型安全**: `as`, `!`, `any` 禁止。Zod バリデーションと Type Guard を使用する。
- **Formatter**: ファイル保存時は必ずフォーマッタを実行する。

### 変更適用ルール（再発防止）

- **単一ファイル編集**: 必ず `apply_patch` ツールを使う（直接呼び出すこと）。
- **禁止事項**: `shell_command` で `apply_patch` を呼び出さない。
- **例外運用**: `apply_patch` が不適切なケース（大規模リライト/生成/自動整形など）は、事前に理由と代替案を提示し、承認を得てから実行する。

## 6. Git & レビュー運用

- **Dangerous Commands**: `git reset --hard`, `clean -fd` 等はユーザー許可必須。
- **PR**: 日本語で記述。
- **i18n**: 文言追加時は `ja.ts`, `en.ts` 両方を更新する。


**重要な注意点:**

- **AI-TDD**: 最初に失敗するテストを書くこと。
- **Next.js Runtime**: デバッグにはMCPツールを使用すること。
- **Japanese Comments**: コード内の日本語ドキュメントを維持すること。
- **影響範囲/手動チェックのログ**: コードの実装・修正を進めるたびに、影響範囲と手動での動作チェックの確認観点を**コンソール（チャット）側のログ**に出力すること。Contextファイルには記載しない。
- **懸念点/手動確認手順の明示**: コード生成・修正後の報告時、懸念点がある場合はその懸念点を明示し、必要に応じて手動での確認方法（操作手順と期待結果）を毎回**コンソール（チャット）側のログ**に出力すること。
- **仕様確定ゲート（必須）**: 仕様が未確定、または「確定/決定/方針/未確定/Draft」系のタスクに当たった場合、**決定を行わない**。  
  - 必ず **複数案 + メリデメ + おすすめ（★）** を提示し、**操縦者の選択があるまで実行/更新しない**。  
  - Draft の仕様書、decision-log 追記、Draft→Confirmed は **操縦者の明示承認が必要**。
- **仕様確定時の実装継続**: 仕様が未確定ではなく、確定している事項の実装は可能な限り止まらずに進めること。
- **仕様未確定時の提案**: 仕様が確定していない領域がある場合、操縦者にメリット・デメリットの両方を示した複数案を提示し、その中で最もおすすめの案に印を付けること。
- **仕様書の更新**: 仕様が決まった段階で必ず仕様書に落とし込むこと。
- **ルール逸脱時の再発防止（必須）**: 何らかのルール逸脱が起きた場合、**再発防止策を必ず策定**し、**すべての LLM Context ファイルに追記**する。  
  - 追記は逸脱の**当日中**に行い、**操縦者の承認後のみ確定**とする。
- **仕様書のSSOT**: 仕様に関する最終判断は仕様書をSSOT（唯一の真実）とすること。
- **仕様書の構成**: 仕様書は `docs/spec/` 配下に機能/テーマ単位で分割し、`docs/spec/README.md` を索引とすること。
- **仕様書フォーマット**: 新規仕様は `docs/spec/_template.md` の書式に従い、状態（Draft/Confirmed）を明記すること。
- **SSOT運用ルール**: Confirmed の仕様のみがSSOT。仕様変更時は該当仕様書と索引の両方を更新すること。
- **仕様書の命名**: 仕様書ファイル名は内容ベースとし、番号の連番は付けない（履歴はGitで管理する）。
- **TODOリスト運用**: 仕様書とは別に `docs/TODO.md` を常時管理すること。大きなタスク依頼時は着手前にTODOを作成/更新し、実行可能な細かな粒度まで分解して記載すること。進捗に応じてTODOを更新すること。TODOストーリー（セクション）を作るときは必ず優先度タグ（P0〜P3など）を付けること。
- **タスク完了時の最新化**: 各タスク完了時に `docs/TODO.md` と関連ドキュメント（仕様書/SSOT/設計/README 等）の最新性を確認し、必要があれば必ず更新すること。
- **TODOタグ運用**: `docs/TODO.md` はFront/Backを分割せず1ファイルで管理し、各項目の先頭に `[FE]` / `[BE]` / `[CROSS]` / `[INFRA]` / `[DOCS]` / `[TEST]` / `[OPS]` のタグを付けて分類すること。
- **SSOT監査ログ運用**: SSOT境界の違反/漏れを検知したら `docs/ops/ssot_violation_audit.md` に記録し、解消したら「解消済み」へ移動する（定期更新は不要）。監査ログは非SSOTであり、必要な仕様/決定更新は別途行うこと。


## 一時的な指示、今後変更の可能性あり

- グループエントリ状態の永続化は現在v3（`groups/items + groupOrder/activeGroupId/activeItemId`）です。レガシーの`entries`ペイロードは読み込み時に正規化されます。

## 7. 互換レイヤー削除メモ（必読）

### useFormContext は最終的に削除する（暫定互換レイヤー）

**理由（詳細）**
- **SSOT を迂回しやすい構造**: `useFormContext` は `canvasObjectsStore` のアクションをフォームAPIとして露出するため、GroupEntryStore を通らずに Canvas 側だけを更新できる。結果、SSOTと表示が乖離しやすい。
- **V3設計と矛盾**: V3ではグループエントリの論理データは GroupEntryStore が唯一の真実。互換レイヤーが残ると「旧フォーム由来の更新経路」が混ざり、設計境界が破れる。
- **不整合の温床**: legacyの `getValues/setValue` 経由は、旧命名のフィールドや Canvas専用の操作が混在しやすく、同期不具合（重複生成・再生成・削除漏れ）の原因になる。
- **バグ調査コスト増**: ルートが複数あると原因追跡が困難。SSOT一本化の前提では、互換レイヤーを残すだけでリスクが上がる。

**削除の完了条件**
- `useFormContext` を直接利用しているコンポーネントがゼロであること。
- GroupEntryStore/CanvasStore を直接参照する実装へ移行済みであること。
- レガシーのフォームAPI (`getValues/setValue` 互換) への依存が除去されていること。

**当面の扱い**
- 互換レイヤーは段階的に縮小する。
- SSOTを迂回するAPI（例: `createGroupEntryTemplate`）は露出させない。

## 8. 設計書運用ルール（Mermaid 必須）

- 設計の全体像は `docs/ssot/architecture-overview.md` を SSOT とする。
- アーキテクチャや責務境界に変更が入った場合、実装変更と同じPRで `docs/ssot/architecture-overview.md` の Mermaid 図を更新する。
- 新しい設計ドキュメントを追加した場合、`docs/ssot/architecture-overview.md` の「関連ドキュメント」に必ずリンクを追加する。
- 設計と実装にズレがある場合は、どちらを正とするかを決めてから修正し、PR説明に理由を明記する。

## 再発防止策（LLM Context 追記）

- 実装前に必ず失敗テストを追加し、`go test ./...`（mise 利用時は `mise exec go -- go test ./...`）で失敗を確認してから実装する。
- 差分編集は必ず `apply_patch` ツールを使い、shell 経由の `apply_patch` は使わない。
