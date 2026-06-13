# Security Policy

This document outlines the security practices and policies for this project.

## Table of Contents

- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Dependency Management](#dependency-management)
- [npm/pnpm Security Configuration](#npmpnpm-security-configuration)
- [CI/CD Security](#cicd-security)
- [Security Auditing](#security-auditing)
- [Content Security Policy](#content-security-policy)
- [Application Security Scanning (Aikido)](#application-security-scanning-aikido)
- [Supply Chain Attack Prevention](#supply-chain-attack-prevention)

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **DO NOT** create a public GitHub issue
2. Contact the maintainer directly at s-hirano-ist@outlook.com
3. Include detailed information about the vulnerability
4. Allow reasonable time for a fix before public disclosure

We take all security reports seriously and will respond as quickly as possible.

## Dependency Management

### Automated Updates with Renovate

This project uses [Renovate](https://docs.renovatebot.com/) for automated dependency management with a security-first approach.

**Configuration**: [.github/renovate.json5](.github/renovate.json5)

**Key Features**:
- **Weekly Schedule**: Updates run every Monday before 11am JST
- **Vulnerability Alerts**: Immediate PRs for security issues (labeled `security`)
- **Minimum Release Age**: 2-day delay for patches/minors to avoid newly published malicious packages
- **Managed Scope**: Renovate handles `npm` / `mise` / `nvm` only. GitHub Actions and docker-compose are handled by Dependabot ([.github/dependabot.yml](.github/dependabot.yml))
- **Grouped Updates**:
  - 非メジャー更新（patch + minor）を依存種別ごとに集約: `non-major`（dependencies / peerDependencies）と `non-major (devDependencies)`
  - `mise` ツール群、および Node.js + pnpm はそれぞれ専用グループ（`mise` / `node and pnpm`）
- **Lock File Maintenance**: Automatic lock file updates to keep dependencies fresh

**Renovate Settings**:
```json5
{
  timezone: 'Asia/Tokyo',
  baseBranchPatterns: ['main'],
  extends: [
    'config:recommended',
    'config:best-practices',
    ':semanticCommitTypeAll(chore)',
    ':enableVulnerabilityAlertsWithLabel(security)',
  ],
  // github-actions / docker-compose are handled by Dependabot, not Renovate.
  enabledManagers: ['npm', 'mise', 'nvm'],
  // Suppress lifecycle scripts (sharp / @prisma/engines / etc.) during Renovate installs.
  ignoreScripts: true,
  schedule: ['before 11am on monday'],
  vulnerabilityAlerts: {
    labels: ['security'],
  },
  lockFileMaintenance: { enabled: true },
  packageRules: [
    // Four rules (npm deps, npm devDeps, mise, node/pnpm) all use:
    {
      matchManagers: ['npm'],
      matchUpdateTypes: ['patch', 'minor'],
      minimumReleaseAge: '2 days',
    },
    // ...
  ],
}
```

### Manual Security Commands

```bash
# Check for vulnerabilities (fails on moderate+ severity)
pnpm security

# Automatically fix security vulnerabilities
pnpm security:fix

# Generate JSON security audit report
pnpm security:report
```

## npm/pnpm Security Configuration

### Version Pinning

**Workspace-level pinning** ([pnpm-workspace.yaml](pnpm-workspace.yaml)):
```yaml
savePrefix: ''
```

This ensures all dependencies are installed with exact versions (e.g., `1.2.3` instead of `^1.2.3`).
`.npmrc` is reserved for auth/registry settings only since pnpm 11 — non-auth pnpm options live in `pnpm-workspace.yaml`.

### Lifecycle Script Protection

**Configuration** ([pnpm-workspace.yaml](pnpm-workspace.yaml)):
```yaml
allowBuilds:
  '@parcel/watcher': true
  '@prisma/engines': true
  '@sentry/cli': true
  '@swc/core': true
  dprint: true
  esbuild: true
  prisma: true
  puppeteer: true
  sharp: true
  sleep: true
  unrs-resolver: true
```

**Why this matters**:
- `allowBuilds` のキーに `true` が設定されたパッケージのみがライフサイクルスクリプト（`postinstall`、`preinstall`等）を実行可能
- 値を `false` にすれば明示的な deny も表現可能（pnpm 11 で `onlyBuiltDependencies` / `ignoredBuiltDependencies` から統合）
- 未登録パッケージのスクリプトはブロックされ、サプライチェーン攻撃を防止
- 新しい依存追加時は `pnpm approve-builds` で対話的にレビュー・承認

### pnpm 11 Hardening

**Configuration** ([pnpm-workspace.yaml](pnpm-workspace.yaml)):
```yaml
strictDepBuilds: true
blockExoticSubdeps: true
```

| 設定 | 役割 |
|------|------|
| `strictDepBuilds: true` | `allowBuilds` 未登録のパッケージがライフサイクルスクリプトを持つ場合、インストールをハードエラー化（pnpm 10 までは警告のみ） |
| `blockExoticSubdeps: true` | 推移的依存が npm レジストリ以外のソース（Git URL / tarball URL）から取得されることをブロック。直接依存は対象外 |

> Note: `trustPolicy: no-downgrade` は現在未設定。Renovate / Dependabot 側が `ERR_PNPM_TRUST_DOWNGRADE` を握りつぶして lockfile 更新ジョブごと落ちるため撤去済み。代替として下記の Minimum Release Age + 手動レビューで provenance 低下監視を担保。

### Minimum Release Age

**Renovate Setting** ([.github/renovate.json5](.github/renovate.json5)):
```json5
minimumReleaseAge: '2 days'  // npm, mise, nvm (Renovate-managed)
```

GitHub Actions / docker-compose use an equivalent cooldown (`cooldown.default-days: 2`) configured in [.github/dependabot.yml](.github/dependabot.yml).

> Note: pnpm-workspace.yaml の `minimumReleaseAge` はRenovateとの競合により無効化中。Renovate側の設定で代替。

**Why this matters**:
- Delays installation of newly published packages
- Gives the community time to identify and report malicious packages
- Reduces exposure to supply chain attacks via package hijacking

### Frozen Lockfiles in CI/CD

**All CI workflows** install via the shared composite action ([.github/actions/setup-pnpm](.github/actions/setup-pnpm/action.yaml)), which runs:
```bash
pnpm i --frozen-lockfile
```

**Why this matters**:
- Ensures reproducible builds
- Prevents unexpected dependency updates during CI
- Catches missing lockfile updates before deployment
- Enforces dependency review process

## CI/CD Security

### GitHub Actions

**Security Best Practices**:
- ✅ Pinned action versions with commit SHA (e.g., `actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6`)
- ✅ Minimal permissions (`permissions: {}` by default)
- ✅ `persist-credentials: false` for checkout actions
- ✅ Frozen lockfiles (`--frozen-lockfile`)
- ✅ Timeout limits (10 minutes)
- ✅ Concurrency controls to prevent resource exhaustion

### Secret Management

**Environment Variables**:
- All secrets stored in GitHub Secrets
- Never committed to repository
- Validated at build time using `@t3-oss/env-nextjs`

**Required Secrets** (configured in GitHub repository settings):
- `AUTH_SECRET`, `AUTH0_*` - Authentication
- `DATABASE_URL` - Database connection
- `MINIO_*` - Object storage
- `PUSHOVER_*` - Notifications
- `SENTRY_*` - Error monitoring

## Security Auditing

### Automated Checks

**pnpm audit**:
- Runs via `pnpm security` command
- Configured to fail on moderate+ severity vulnerabilities
- Threshold: `--audit-level=moderate`

**Renovate vulnerability alerts**:
- Automatic PRs for vulnerable dependencies
- Labeled with `security` for easy identification
- Prioritized over regular dependency updates

### Recommended Audit Schedule

1. **Weekly**: Review Renovate PRs (automated)
2. **Before release**: Run `pnpm security` manually
3. **After security announcements**: Run `pnpm security:fix` and `pnpm security:report`

## Content Security Policy

The application uses a request-scoped nonce generated in `app/src/proxy.ts`.
The nonce is forwarded to server rendering through the internal `x-nonce`
header and an upstream `Content-Security-Policy` request header. Browser
responses currently receive `Content-Security-Policy-Report-Only` while the
policy is being validated.

### Policy

- `script-src` permits self, the request nonce, Vercel Analytics, development-only React Scan, and Preview-only Vercel Toolbar.
- Production does not allow `unsafe-inline` or `unsafe-eval` for scripts.
- Production `style-src-elem` requires self or the request nonce.
- `style-src-attr 'unsafe-inline'` remains enabled because UI positioning and syntax highlighting use dynamic style attributes.
- The shared `ThemeProvider` initializes `get-nonce` during React's insertion phase so client-side styles created by `next-themes`, Radix UI, and `react-remove-scroll` receive the request nonce.
- Preview deployments allow the additional script, connection, image, frame, style, and font sources documented for Vercel Toolbar.
- CSP violations are reported to the configured Sentry reporting endpoint through `report-uri` and `Report-To`.

### Enforcement rollout

Before replacing `Content-Security-Policy-Report-Only` with
`Content-Security-Policy`:

1. Exercise authentication, locale navigation, theme switching, Toast, Dialog, Drawer, Lightbox, and Markdown code rendering in Preview.
2. Confirm that Sentry contains no unexplained violations from supported browsers.
3. Verify production Report-Only telemetry separately because Preview intentionally has a broader Toolbar policy.
4. Change only the response header name in Proxy; keep the upstream request header enforced so Next.js continues to attach nonces during SSR.

Cache Components / PPR are intentionally disabled because their reusable static
HTML shell cannot carry a fresh nonce for every request. Database query results
remain cached with tenant-scoped `unstable_cache` keys and tags.

## Application Security Scanning (Aikido)

This project uses [Aikido Security](https://www.aikido.dev/) (Forever Free plan) for
application-level security scanning, complementing the dependency- and supply-chain-focused
controls above.

### Integration: GitHub App (Zero Code Integration)

Aikido is connected via its **GitHub App**, not a CI workflow:

- **Read-only** access through the GitHub App system — no tokens are stored and the source
  code is wiped after each analysis
- **No GitHub Actions minutes** are consumed and **no `AIKIDO_SECRET_KEY`** is stored in
  repository secrets
- Scans run automatically and re-scan every 3 days

### Scope (free plan)

ダッシュボードで以下を可視化（無料枠でフル機能）:

| スキャン | 役割 |
|---------|------|
| SAST | oxlint の sonarjs ルールでは拾えないアプリ脆弱性パターン |
| Secrets | ハードコードされたシークレット/クレデンシャル検出 |
| IaC | `compose.yaml` / Dockerfile 等の設定不備検出 |
| SCA (dependencies) | 依存 CVE（既存 Renovate / `pnpm audit` と重複するため副次的） |

### PR Gating

- Aikido GitHub App が PR に**ステータスチェックを直接投稿**する
- `main` の branch protection で当該チェックを **required** に指定してマージを制御する
- **無料枠で実際にマージをブロックできるのは依存 CVE のみ。** SAST / IaC / ライセンスの
  ブロックは有償プラン限定のため、本プロジェクトではこれらは**可視化（検知・レポート）**に
  留める

### Why a GitHub App instead of a CI workflow

無料枠でブロックできる対象（依存 CVE のみ）はどちらの方式でも同じ。GitHub App 方式は CI 分を
消費せず、`AIKIDO_SECRET_KEY` の保存も不要で、read-only のため採用した。

### Why Zen is not used

Aikido の in-app firewall [Zen](https://www.aikido.dev/zen)（`@aikidosec/firewall`）は不採用。
Next.js では `output: "standalone"` ＋ `node -r @aikidosec/firewall/instrument server.js` での
カスタム起動が必須で、起動コマンドを制御できない **Vercel サーバーレスでは動作しない**
（`middleware` / `instrumentation` への組み込みも Next.js のビルド都合で不可）。VPS 側は
Node.js アプリではない（TEI / MinIO）ため適用先もない。

### Setup (one-time, dashboard / GitHub settings)

1. [aikido.dev](https://www.aikido.dev/) に GitHub アカウントでサインアップ（Forever Free プラン）
2. GitHub App を本リポジトリに接続（対象リポジトリのみ許可可）
3. ダッシュボードの GitHub CI ページで対象リポジトリを選び **Setup PR Scans**（severity・実行スキャンを設定）
4. GitHub の `main` branch protection で Aikido のステータスチェックを required に指定

> 無料枠制約: 2 ユーザー / 10 リポジトリ / 1 ドメイン / 1 クラウド接続 / 再スキャン 3 日ごと。

## Supply Chain Attack Prevention

### Multi-layered Defense Strategy

1. **Version Pinning**: Exact versions prevent unexpected updates
2. **Lifecycle Script Protection**: `allowBuilds` で承認済みパッケージのみスクリプト実行可能
3. **Strict Build Enforcement**: `strictDepBuilds: true` で未登録パッケージの build script をハードエラー化
4. **Exotic Subdep Blocking**: `blockExoticSubdeps: true` で npm レジストリ以外由来の推移的依存を遮断
5. **Minimum Release Age**: 2日の Renovate delay（GitHub Actions / docker-compose は Dependabot の cooldown で同等の遅延）
6. **Frozen Lockfiles**: Reproducible builds in CI/CD
7. **Automated Monitoring**: Renovate tracks vulnerabilities
8. **Manual Auditing**: `pnpm audit` for on-demand checks

### Package Installation Safety

**When adding new dependencies**:
```bash
# Check package reputation first
npm view <package-name>

# Verify maintainers and download stats
# Install with exact version
pnpm add <package-name> --save-exact

# Review package contents before using
ls node_modules/<package-name>
```

**Red flags to watch for**:
- ⚠️ Newly published packages with no history
- ⚠️ Packages with very few downloads
- ⚠️ Unusual lifecycle scripts
- ⚠️ Obfuscated code
- ⚠️ Requests for unnecessary permissions

### Dependency Review Process

**Before merging Renovate PRs**:
1. ✅ Check changelog for breaking changes
2. ✅ Review security labels
3. ✅ Verify CI passes
4. ✅ Test in preview environment
5. ✅ Check for unexpected behavior

## Best Practices for Contributors

### Local Development

```bash
# Always use frozen lockfile locally for consistency
pnpm install --frozen-lockfile

# Run security audit before committing
pnpm security

# Keep dependencies up to date (let Renovate handle it)
# DO NOT manually update dependencies without good reason
```

### Adding New Dependencies

1. Search for existing alternatives in the project
2. Check package reputation (downloads, maintainers, last update)
3. Review package security advisories
4. Add with exact version: `pnpm add <pkg> --save-exact`
5. Document why the dependency is needed

### Code Review Checklist

- [ ] No hardcoded secrets or credentials
- [ ] Environment variables properly validated
- [ ] New dependencies reviewed for security
- [ ] No bypass of security controls
- [ ] Error messages don't leak sensitive info

## References

### Security Resources

- [npm Security Best Practices](https://github.com/bodadotsh/npm-security-best-practices)
- [pnpm Security](https://pnpm.io/security)
- [Renovate Documentation](https://docs.renovatebot.com/)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Snyk Advisor](https://snyk.io/advisor/)
- [Aikido Security](https://www.aikido.dev/) - Application security scanning (SAST / secrets / IaC)

### Internal Documentation

- [.npmrc](.npmrc) - npm/pnpm configuration
- [pnpm-workspace.yaml](pnpm-workspace.yaml) - Workspace and security settings
- [.github/renovate.json5](.github/renovate.json5) - Renovate configuration
- [CLAUDE.md](CLAUDE.md) - Development guidelines including security commands

---

**Last Updated**: 2026-06-06

For questions about this security policy, contact s-hirano-ist@outlook.com.
