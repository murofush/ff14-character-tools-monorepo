# TODO

## [P1] SSOT運用への移行（設計書再編）

- [x] [DOCS] 既存 `docs/design-spec.md` の構成を棚卸しする
- [x] [DOCS] `docs/spec/_template.md` を作成する
- [x] [DOCS] `docs/spec/README.md` を作成し仕様索引を定義する
- [x] [DOCS] 主要機能仕様を `docs/spec/` へ分割して移行する
- [x] [DOCS] SSOTルール（Confirmedのみ）を明記する
- [x] [OPS] SSOT境界の違反を監査ログへ記録する
- [x] [DOCS] README の導線を `docs/spec/README.md` ベースへ更新する

## [P2] 仕様テスト整備（次フェーズ）

- [ ] [TEST] `buildProfileText` の単体テストを追加する
- [ ] [TEST] テンプレート変更時のUI挙動テストを追加する
- [ ] [TEST] コピー失敗時メッセージのテストを追加する

## [P1] セキュリティ是正（2026-02-07）

- [x] [SEC] 旧Nuxt API の未認証書き込み経路を除去する
- [x] [SEC] リポジトリ内の秘密鍵ファイルを除去する
- [x] [SEC] `esbuild` 既知脆弱性を解消する
