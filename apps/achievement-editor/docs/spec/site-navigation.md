# Site Navigation 仕様

- Status: Confirmed
- Owner: Frontend
- Last Updated: 2026-02-05
- Source of Truth: This file (only when Status = Confirmed)

## Purpose

サービス導線を明確にし、Home から Profile Builder への遷移を最短化する。

## Scope

- In scope:
  - ヘッダーナビゲーション
  - `/` と `/profile-builder` のルーティング
  - Home の CTA 導線
- Out of scope:
  - 複雑な多階層ナビゲーション

## Functional Requirements

1. ヘッダーに Home / 自己紹介作成 のリンクを表示する。
2. `/` はサービス概要と CTA を表示する。
3. CTA から `/profile-builder` へ遷移できる。
4. `/profile-builder` は自己紹介作成UIを表示する。

## Non-Functional Requirements

- React Router を利用した SPA 遷移であること。
- ナビゲーションは視認性のあるスタイルを維持すること。

## UX / Screen Behavior

- ヘッダーは上部固定表示（sticky）とする。
- 現在ページのリンクに active スタイルを適用する。

## Data Contract

- ルーティングパス:
  - `/`
  - `/profile-builder`

## Flow

1. ユーザーが Home を表示。
2. CTA またはヘッダーリンクを押下。
3. Profile Builder へ遷移。

## Acceptance Criteria

- [ ] Home から Profile Builder に遷移できる。
- [ ] ヘッダーリンクで相互遷移できる。
- [ ] active スタイルが現在ページに適用される。

## Change Log

- 2026-02-05: SSOT運用に合わせ Confirmed 仕様として定義。
