# Next.js 16.3等のパッチ更新を検証する

## Metadata

| Field | Value |
| --- | --- |
| Category | Maintenance |
| Priority | MEDIUM |
| Status | 未着手 |

## 更新候補

2026-09-12のnpm/公式release確認に基づく。着手時に再確認する。

- Next.js 16.3.4 → 16.3.5。image cache、adapter付きstandalone trace、CSP nonce等の修正。
  [公式release](https://github.com/vercel/next.js/releases/tag/v16.3.5)
- next-intl 4.14.3 → 4.14.4。cookieのbase path判定修正。
  [公式release](https://github.com/amannn/next-intl/releases/tag/v4.14.4)
- Zod 4.6.1 → 4.6.2、happy-dom 20.14.3 → 20.14.5。
- lucide-react 1.44.0 → 1.45.0はminorなので上記パッチとは分けて表示確認。

## 方針・完了条件

- [ ] 同一依存を宣言するworkspace間を揃え、lockfile差分を確認する。
- [ ] React 19.3 / TypeScript 7 / Vitest 5 / Vite 8 / Prisma RCを混在させない。
- [ ] UI関連変更前にStorybook MCPの指示を取得。
- [ ] `pnpm check:agent`、`pnpm build`、`pnpm audit --json`。
- [ ] 型付きroute、i18n cookie、認証session、画像表示、フォームのschema validationを確認。
- [ ] Vercel向けbuildとself-hosted standaloneの双方を検証。
  修正のrelease noteだけで現在のVercel分岐を削除しない。
- [ ] 本番deployは含めない。完了後に本issueを削除。

推移依存の脆弱性は[専用issue](security-001-transitive-dependencies.md)でも残存経路を管理する。
