# 長期停止・再開ランブック（2026-02-17時点）

## 目的

- 本プロダクトを長期間停止したあとでも、再開時に迷わず最短で作業再開できる状態を維持する。
- 未完タスクの優先順と、再開初日の実行コマンドを固定する。

## 停止前チェック

1. 現在の差分が失われないように、作業ブランチへチェックポイントコミットする。
2. `docs/TODO.md` の未完タスクを確認し、追加の未整理事項があれば追記する。
3. 次の2コマンドが通る状態を維持する。

```bash
pnpm --filter @ff14/chara-card-creator test
pnpm --filter @ff14/chara-card-creator build
```

## 再開初日（最初の30分）

1. 依存解決と差分確認。

```bash
pnpm install
git status --short
```

2. 既存状態の健全性確認。

```bash
pnpm --filter @ff14/chara-card-creator test
pnpm --filter @ff14/chara-card-creator build
```

3. `docs/TODO.md` の未完タスクに着手順を付与して当日計画を作る。

## 再開時の優先順（固定）

1. `chara-card-creator` の未完FEを完了する。
- `docs/TODO.md` の以下2項目を最優先で潰す。
- `[FE] [ ] \`chara-card-creator\` \`/edit-chara-card\` に旧 \`editCharaCard.vue\` + \`characterCard/*\` の機能責務（画像トリミング、カード設定、PNG保存）を完全移植する`
- `[FE] [ ] \`chara-card-creator\` \`/edit-chara-card\` の旧Canvas同等責務（Konva実描画とのピクセル差異調整）を追加移植する`

2. 移行完了判定を実施する。
- `[TEST] [ ] \`docs/spec/migration-completion-runbook.md\` に従って完了判定を実施する`

3. 実環境の運用確認を実施する。
- `[OPS] [ ] \`tag/tag.json\` \`patch/patch.json\` \`editedAchievementData/*\` のCloud Storage実在パス・公開設定・権限を実環境で確認する`
- `[OPS] [ ] \`docs/spec/storage-path-and-permission-validation-runbook.md\` を実施し、結果を記録する`

4. backendの実環境E2Eを実施する。
- `[TEST] [ ] Cloud Run + 実GCSバケットでのE2E疎通テストを追加する`

## 完了条件（このランブックのゴール）

1. `docs/TODO.md` の未完が、環境依存確認のみを除いてゼロである。
2. `chara-card-creator` のテスト・ビルドが継続して成功する。
3. 移行完了判定ランブックの結果が記録済みである。

## メモ

- 本ランブックは「再開時の最短復帰」を目的とする。実装仕様のSSOTは引き続き `docs/spec/` の Confirmed 文書を参照する。
