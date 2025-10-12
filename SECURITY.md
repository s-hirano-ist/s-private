# Security Policy

This document outlines the security practices and policies for this project.

## Table of Contents

- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Dependency Management](#dependency-management)
- [npm/pnpm Security Configuration](#npmpnpm-security-configuration)
- [CI/CD Security](#cicd-security)
- [Security Auditing](#security-auditing)
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
- **Minimum Release Age**: 3-day delay for patches/minors to avoid newly published malicious packages
- **Grouped Updates**:
  - Patch updates grouped together
  - Minor updates grouped together
  - GitHub Actions updates grouped separately
- **Lock File Maintenance**: Automatic lock file updates to keep dependencies fresh

**Renovate Settings**:
```json5
{
  extends: [
    'config:recommended',
    'config:best-practices',
    ':enableVulnerabilityAlertsWithLabel(security)',
  ],
  schedule: ['before 11am on monday'],
  vulnerabilityAlerts: {
    labels: ['security'],
  },
  packageRules: [
    {
      matchUpdateTypes: ['patch', 'minor'],
      minimumReleaseAge: '3 days',
    },
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

**Multiple layers of version pinning to prevent unexpected updates**:

1. **Root-level** ([.npmrc](.npmrc)):
   ```ini
   save-exact=true
   ```

2. **Workspace-level** ([pnpm-workspace.yaml](pnpm-workspace.yaml)):
   ```yaml
   savePrefix: ''
   ```

This ensures all dependencies are installed with exact versions (e.g., `1.2.3` instead of `^1.2.3`).

### Lifecycle Script Protection

**Configuration** ([.npmrc](.npmrc)):
```ini
# Disable lifecycle scripts for external dependencies
ignore-dep-scripts=true

# Enable pre/post scripts for our own packages (e.g., Prisma postinstall)
enable-pre-post-scripts=true
```

**Why this matters**:
- Prevents malicious `postinstall`, `preinstall` scripts from external packages
- Protects against supply chain attacks via compromised dependencies
- Our own workspace packages can still run necessary scripts (like Prisma client generation)

### Minimum Release Age

**Global Setting** ([pnpm-workspace.yaml](pnpm-workspace.yaml)):
```yaml
minimumReleaseAge: 1440  # 24 hours
```

**Additional Renovate Setting** ([.github/renovate.json5](.github/renovate.json5)):
```json5
minimumReleaseAge: '3 days'  # 72 hours for patches/minors
```

**Why this matters**:
- Delays installation of newly published packages
- Gives the community time to identify and report malicious packages
- Reduces exposure to supply chain attacks via package hijacking
- Balances security with access to bug fixes and features

### Frozen Lockfiles in CI/CD

**All CI workflows** ([.github/workflows/ci.yaml](.github/workflows/ci.yaml)) use:
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
- ✅ Pinned action versions with commit SHA (e.g., `actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8`)
- ✅ Minimal permissions (`permissions: {}` by default)
- ✅ `persist-credentials: false` for checkout actions
- ✅ Frozen lockfiles (`--frozen-lockfile`)
- ✅ Timeout limits (20 minutes)
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

## Supply Chain Attack Prevention

### Multi-layered Defense Strategy

1. **Version Pinning**: Exact versions prevent unexpected updates
2. **Lifecycle Script Protection**: Blocks malicious install scripts
3. **Minimum Release Age**: 24-hour global + 3-day Renovate delay
4. **Frozen Lockfiles**: Reproducible builds in CI/CD
5. **Automated Monitoring**: Renovate tracks vulnerabilities
6. **Manual Auditing**: `pnpm audit` for on-demand checks

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

### Internal Documentation

- [.npmrc](.npmrc) - npm/pnpm configuration
- [pnpm-workspace.yaml](pnpm-workspace.yaml) - Workspace and security settings
- [.github/renovate.json5](.github/renovate.json5) - Renovate configuration
- [CLAUDE.md](CLAUDE.md) - Development guidelines including security commands

---

**Last Updated**: 2025-10-13

For questions about this security policy, contact s-hirano-ist@outlook.com.
