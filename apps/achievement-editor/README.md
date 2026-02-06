# FF14 Profile Tools (React + Vite)

FF14プレイヤー向けの自己紹介文を素早く作成するためのSPAです。

## 技術スタック

- React 18
- TypeScript
- Vite
- React Router
- pnpm

## 推奨開発環境

- Node.js 20 以上（`.nvmrc` を参照）
- pnpm 10.13.1 以上

## セットアップ

- `pnpm install`
  依存パッケージをインストールする。

- `pnpm dev`
  AchievmentEditor を実行する。
  `https://localhost:3000`上にて実行される。

## 開発コマンド

- `pnpm dev` : 開発サーバ起動
- `pnpm build` : 本番ビルド
- `pnpm preview` : ビルド結果のプレビュー
- `pnpm lint` : ESLint実行

## 主なページ

- `/` : ランディングページ
- `/profile-builder` : FF14自己紹介作成ページ


## Private package auth

This project depends on `@murofush/*` packages hosted on GitHub Packages.
Before `pnpm install`, configure your token:

```bash
pnpm config set //npm.pkg.github.com/:_authToken <GITHUB_NPM_TOKEN>
```

## 仕様・ドキュメント

- 仕様（SSOT）索引: `docs/spec/README.md`
- TODO管理: `docs/TODO.md`
- SSOT監査ログ: `docs/ops/ssot_violation_audit.md`
