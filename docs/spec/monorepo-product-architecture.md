# Monorepo プロダクト設計定義

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-07

## 目的/背景

- 本モノレポで扱うプロダクト責務を `front` / `admin-front` / `backend` の3領域に固定する。
- 取得系（read）と保存系（write）の境界を明確化し、移行中の実装判断を一貫させる。

## 仕様

1. アプリ責務の分割
- `front`:
  - エンドユーザー向け機能（キャラカード作成・閲覧体験）を提供する。
  - 既存モノレポ上では `apps/chara-card-creator` が該当する。
- `admin-front`:
  - 運用者向け編集機能（アチーブメント/タグ/パッチ編集）を提供する。
  - 既存モノレポ上では `apps/achievement-editor` が該当する。
- `backend`:
  - 保存APIとLodestone補助取得APIを提供する。
  - `front` / `admin-front` から呼び出される書き込み・補助取得の責務を担う。

2. データ責務
- `achievementData`:
  - Lodestone由来の取得データ（配布用元データ）。
  - `AchievementFetcher` が生成する。
- `editedAchievementData`:
  - 運用編集後のアチーブメントデータ。
  - `admin-front` で編集し、`backend` 経由で保存する。
- `tag` / `patch`:
  - 編集UIで扱う定義データ。
  - `admin-front` で編集し、`backend` 経由で保存する。

3. 取得経路と保存経路
- 取得（read）:
  - 旧実装では Cloud Storage 公開URL（`forfan-resource`）からの直接取得を許容する。
  - `admin-front` の初期ロードはこの read 経路で成立する。
- 保存（write）:
  - `POST /api/save_text` を backend が提供する。
  - `admin-front` は backend 未実装時、編集結果を永続化できない。
- Lodestone補助取得:
  - `/api/get_hidden_achievement`
  - `/api/get_icon_img`
  - `/api/get_item_infomation`
  - いずれも backend 実装責務。

4. AchievementFetcher の位置付け
- `AchievementFetcher` は実行時APIではなく、データ生成バッチである。
- 役割:
  - Lodestone のカテゴリ一覧/詳細をスクレイピングして `achievementData` を生成する。
  - アイコン/報酬画像のダウンロードとパス化を行う。
- 非役割:
  - `admin-front` が直接呼ぶ `/api/*` の提供。

5. ディレクトリ設計方針
- 目標構成:
  - `apps/front`
  - `apps/admin-front`
  - `apps/backend`
- 移行期は既存ディレクトリ名を維持しつつ、責務定義を優先して運用する。

## 受け入れ条件

- すべての実装タスクで、`front` / `admin-front` / `backend` のどれに属するか説明できる。
- `admin-front` の read/write 境界（readはCloud Storage、writeはbackend）を仕様として再利用できる。
- `AchievementFetcher` を実行時APIと混同しない。

## 非ゴール

- backend の内部実装技術（FW/DB/ホスティング）の固定。
- UIデザイン詳細の固定。

## 影響範囲

- Front: `apps/chara-card-creator`, `apps/achievement-editor`
- Back: `apps/backend`（新設時の責務定義）
- Domain: achievement/tag/patch のデータ運用境界
- Infra: Cloud Storage配布とAPI提供責務の分離
- Docs: 各プロダクト仕様との整合管理

## 既存挙動との差分

- 旧資料では `achievementData` 取得と `/api/*` 責務の境界が曖昧だった。
- 本仕様により、read/write責務とバッチ責務を明示的に分離した。

## 移行/互換方針

- 既存アプリ名は段階的に整理し、責務定義を先行固定する。
- backend 未実装期間は、`admin-front` を「取得・編集は可能、保存・補助取得は不可」の前提で運用する。
- backend 実装後は、`/api/*` 契約互換を維持したまま接続する。

## 関連リンク

- `docs/spec/achievement-editor-product-charter.md`
- `docs/spec/achievement-editor-legacy-api-data-contract.md`
- `docs/spec/chara-card-creator-product-charter.md`
- `apps/achievement-editor/store/achievement.ts`
- `apps/achievement-editor/components/achievementCreator.vue`
- `forfan-common-package/AchievementFetcher/src/common.ts`
