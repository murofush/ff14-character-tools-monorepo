# Profile Builder 仕様

- Status: Confirmed
- Owner: Frontend
- Last Updated: 2026-02-05
- Source of Truth: This file (only when Status = Confirmed)

## Purpose

FF14プレイヤーが募集用途に応じた自己紹介文を短時間で生成し、外部サービスへ転記できるようにする。

## Scope

- In scope:
  - テンプレート選択（固定募集 / フレンド募集 / FC募集）
  - 入力フォーム編集
  - リアルタイムプレビュー
  - コピー / リセット操作
- Out of scope:
  - サーバ保存
  - 端末間同期
  - ユーザー認証

## Functional Requirements

1. ユーザーはテンプレートを選択できる。
2. テンプレート変更時、該当する既定値（目的/活動/VC/ひとこと）をフォームへ反映する。
3. ユーザーは全入力項目を編集できる。
4. フォーム更新時、プレビューは即時更新される。
5. コピー操作でプレビュー文面をクリップボードへ書き込む。
6. リセット操作で「共通初期値 + 現在テンプレート既定値」に戻す。
7. コピー/リセット実行結果メッセージを表示する。

## Non-Functional Requirements

- TypeScriptで型安全に管理する。
- モバイル（900px以下）で1カラム表示に切り替える。
- API通信なしで完結する。

## UX / Screen Behavior

- 左: 入力フォーム、右: プレビューの2カラム（デスクトップ）。
- プレビュー冒頭にテンプレートラベルを表示する。
- クリップボード非対応環境では失敗メッセージを表示する。

## Data Contract

- TemplateKey: `fixed | friend | fc`
- ProfileForm fields:
  - `characterName`
  - `world`
  - `mainJob`
  - `playStyle`
  - `playTime`
  - `voiceChat`
  - `activity`
  - `objective`
  - `appeal`
- 空値は出力時に `未入力` として扱う。

## Flow

1. テンプレート選択変更。
2. テンプレートキーを更新し、部分既定値をフォームにマージ。
3. 入力変更に応じて `profileText` を再計算。
4. コピー時は `navigator.clipboard.writeText(profileText)` 実行。
5. リセット時は初期値再構築のうえフォーム更新。

## Acceptance Criteria

- [ ] テンプレート変更で既定値が反映される。
- [ ] 入力変更がプレビューへリアルタイム反映される。
- [ ] コピー成功時に成功メッセージが表示される。
- [ ] クリップボード非対応時に失敗メッセージが表示される。
- [ ] リセット時に現在テンプレート基準の値へ戻る。

## Change Log

- 2026-02-05: SSOT運用に合わせ `docs/spec/` 配下へ再定義し Confirmed 化。
