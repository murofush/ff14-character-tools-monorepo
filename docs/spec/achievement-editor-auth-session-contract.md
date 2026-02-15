# Achievement Editor 認証・セッション契約仕様

## ステータス

- 状態: Confirmed
- 決定日: 2026-02-12

## 目的/背景

- `achievement-editor` は旧Vueで `loginButton` を持っていたが、現行では認証UIと実行時セッション契約が不足している。
- 完全移行には「誰が編集できるか」「トークンをどう扱うか」を実装可能な粒度で確定する必要がある。

## 仕様

1. 方針候補（比較）
- 案A: 固定Bearerトークンを手入力して利用する。
  - メリット: 実装が単純。
  - デメリット: 運用事故リスクが高く、本番利用に不適。
- 案B（★採用）: Firebase Login + ID Token を Bearer として送信する。
  - メリット: 既存 backend 契約（`AUTH_BACKEND=firebase`）と整合。
  - デメリット: 認証SDK組み込みが必要。
- 案C: backend セッションCookie方式へ変更。
  - メリット: トークン露出を減らせる。
  - デメリット: 既存契約を大きく変更し、移行コストが高い。

2. 採用方針（確定）
- 本番/検証環境: Firebase ID Token 方式（案B）。
- ローカル開発: `AUTH_BACKEND=static` + 固定トークンを許容（開発用途のみ）。

3. UI 契約
- ヘッダに認証状態表示領域を設ける。
  - 未ログイン: `ログイン` ボタン表示。
  - ログイン済: 表示名 / UID / ログアウト導線を表示。
- 旧 `loginButton.vue` と同等の責務を維持する。

4. API 呼び出し契約
- `save_text` と `get_*` 呼び出し時に `Authorization: Bearer <idToken>` を付与する。
- ID Token 未取得時は API 呼び出しを抑止し、ユーザーへ再ログイン導線を提示する。

5. セッション維持契約
- 認証状態の変化（ログイン/ログアウト/トークン失効）を購読し、UI状態へ反映する。
- 期限切れ等で `401` を受けた場合:
  - 1回だけトークン再取得を試行する。
  - 再試行後も `401` の場合、ログイン状態を解除して再ログインを要求する。

6. エラー契約
- 認証エラーは API エラーと区別して表示する。
  - 例: `認証の有効期限が切れました。再ログインしてください。`
- 保存失敗や取得失敗は従来どおり業務エラーとして表示する。

7. セキュリティ契約
- ID Token を永続ストレージへ平文保存しない。
- 開発用固定トークンは `.env.local` 等で扱い、リポジトリへコミットしない。

## 受け入れ条件

- 未ログイン時に編集APIが実行されない。
- ログイン済みで `save_text` / `get_*` が認証付きで成功する。
- `401` 発生時に再認証フローへ移行できる。

## 非ゴール

- 権限ロール（閲覧専用/編集者/管理者）の多段設計。
- 複数IDプロバイダ対応。

## 影響範囲

- Front: `apps/achievement-editor/src/app/App.tsx`（認証UI表示）
- Front: `apps/achievement-editor/src/features/editor/lib/*`（API呼び出し時のトークン付与）
- Back: `apps/backend`（Firebase検証契約との整合）
- Infra: Firebaseプロジェクト設定・運用者アカウント管理
- Docs: 本仕様、機能同等チェックリスト、backend runtime config

## 既存挙動との差分

- 旧Vueでは認証UIが存在したが、現行では環境変数トークン前提でUI責務が欠落している。
- 本仕様で認証UIと実行時トークン挙動を再固定した。

## 移行/互換方針

- Phase 1: 認証UIと状態管理を実装し、固定トークン依存を縮小。
- Phase 2: Firebase ID Token を既定化し、`static` はローカル限定運用にする。

## 関連リンク

- `docs/spec/achievement-editor-product-charter.md`
- `docs/spec/achievement-editor-functional-equivalence-checklist.md`
- `docs/spec/achievement-editor-backend-api-spec.md`
- `docs/spec/achievement-editor-backend-runtime-config.md`
- `apps/achievement-editor/components/loginButton.vue`
- `apps/backend/internal/auth/firebase_token_validator.go`
