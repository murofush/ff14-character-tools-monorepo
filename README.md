# ff14-character-tools-monorepo

FF14向けツール群を `pnpm` ワークスペースで一元管理するモノレポです。

## 構成

- `apps/chara-card-creator` (`@ff14/chara-card-creator`)
- `apps/achievement-editor` (`@ff14/achievement-editor`)
- `packages/tsconfig` (共通 TypeScript 設定)

## 前提

- Node.js `20+`
- pnpm `10.13.1+`

## セットアップ

```bash
pnpm install
```

`pnpm` 以外で install すると `preinstall` でエラーになります。

## 開発

```bash
pnpm dev
pnpm dev:chara
pnpm dev:achievement
```

## ビルド

```bash
pnpm build
```

## 型チェック / Lint

```bash
pnpm typecheck
pnpm lint
```

## 個別実行

```bash
pnpm build:chara
pnpm build:achievement
pnpm preview:chara
pnpm preview:achievement
```
