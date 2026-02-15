# Chara Card Backend API 実装仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-12

## 目的/背景

- `chara-card-creator` 旧実装の `/api/get_character_info` は front 内同梱実装だった。
- API 所有権を backend に集約する方針に合わせ、`get_character_info` の実装契約を確定する。

## 仕様

1. 設計方針
- 旧 front 契約（URL/レスポンス構造）を互換維持する。
- `front` は API クライアントに徹し、スクレイピング責務は backend が持つ。
- 本エンドポイントはエンドユーザー起点のため、運用者認証は要求しない。

2. エンドポイント
- `GET /api/get_character_info`

3. リクエスト契約
- Query:
  - `url: string`（必須）
- 入力検証:
  - Lodestone character URL の正規表現一致
  - 末尾 `/`、`?query`、`#fragment` を正規化して扱う
- 不正入力:
  - `400` + `LocalError`

4. レスポンス契約（成功）
- `200` + `ResponseData`
  - `characterID: number`
  - `fetchedDate: Date`
  - `characterData: CharacterInfo`
  - `completedAchievementsKinds: CompletedAchievementsKind[]`
  - `isAchievementPrivate: boolean`
  - `freecompanyInfo?: FreecompanyPositionInfo & FreecompanyInfo`

5. 実績非公開時の契約
- Lodestone 側で実績が private の場合:
  - `isAchievementPrivate: true`
  - `completedAchievementsKinds` は空配列を許容
  - `characterData` は返却する

6. レスポンス契約（失敗）
- 旧互換:
  - `400` + `LocalError`（入力不正・取得失敗）
  - `429`（レート制限）
  - `500`（予期しない例外）
- 代表エラー:
  - `url_invalid`
  - `FETCH_LDST_ERROR` 相当
  - `not_found_user`（FC所属情報検索失敗時）

7. 認証・レート制御
- 認証:
  - 不要（公開取得API）
- レート制御:
  - IP 単位または匿名キー単位で制限を設ける（例: 30 req/min）
- 目的:
  - Lodestone への過負荷防止

8. 依存ロジック
- Lodestone 抽出ロジックは旧実装・共通パッケージ準拠で実装する。
- 取得結果の型は `forfan-common-package` の型契約に従う。

## 受け入れ条件

- 旧 front と同じリクエストで `ResponseData` を返せる。
- 実績非公開時に `isAchievementPrivate` が正しく立つ。
- 不正URLで `400` を返せる。
- レート制限時に `429` を返せる。

## 非ゴール

- Lodestone DOM 変更の自動追従保証。
- 完全な多言語URL対応（必要時に別仕様で拡張）。

## 影響範囲

- Front: `apps/chara-card-creator` の API 呼び先切替
- Back: `apps/backend` への新規ハンドラ追加
- Domain: `ResponseData` 契約互換
- Infra: レート制限設定・監視
- Docs: API所有権仕様、移行完了ランブック

## 既存挙動との差分

- 旧実装では front 内 API として提供していた。
- 本仕様では backend 集約を前提とする。

## 移行/互換方針

- backend 実装完了後、front の呼び先を切替する。
- 切替後に旧 front 同梱 API を段階削除する。

## 関連リンク

- `docs/spec/monorepo-api-ownership-and-routing.md`
- `docs/spec/chara-card-creator-legacy-api-data-contract.md`
- `docs/spec/chara-card-creator-functional-equivalence-checklist.md`
- `apps/chara-card-creator/api/index.ts`
