# s-private

![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)
![CI/CD status](https://img.shields.io/github/actions/workflow/status/s-hirano-ist/s-private/cd.yaml?branch=main)
![GitHub stars](https://img.shields.io/github/stars/s-hirano-ist/s-private.svg)

> [!IMPORTANT]
> This is a contents dump and search app made by s-hirano. Some codes are not best practices due to trying experimental features and new techs.

**Main Framework** - [Next.js](https://nextjs.org/)  
**Type Checking** - [TypeScript](https://www.typescriptlang.org/)  
**Package Manager** - [pnpm](https://pnpm.io/)  
**Styling** - [Shadcn/ui](https://ui.shadcn.com/)  
**Database** - [PostgreSQL](https://www.postgresql.org/)  
**Object Storage** [Cloudfare R2](https://www.cloudflare.com/ja-jp/developer-platform/products/r2/)  
**ORM** - [Prisma](https://www.prisma.io/)  
**Vulnerabilities Checks** - [npm-audit](https://docs.npmjs.com/cli/v10/commands/npm-audit) & [Dependabot alert](https://docs.github.com/ja/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)  
**Rendering Checks** -[React Scan](https://github.com/aidenybai/react-scan)  

## 初期設定

```bash
git clone https://github.com/s-hirano-ist/s-private.git
cd s-private
```

## Continuous Deployment

GitHubにブランチが作成されるとVercel cloudに自動的にPreview環境が構築される。

GitHubのmainブランチにPRがpullされるとProduction環境が更新される。

## Docker Imageのビルドとプッシュ

MainブランチにPRがpushされたら自動的に[DockerHub](https://hub.docker.com/repository/docker/s0hirano/s-private/general)にイメージがpushされる仕組み。

## 起動方法

### 開発環境

```bash
pnpm install
docker compose up --build -d
pnpm dev
```

### 旧本番環境（現在はVercelに移行）

[s-tools/s-private](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

### Storybook（現在はCloudflare Pagesに移行）

[s-tools/s-storybook](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

## 📜 License

Licensed under the AGPL-3.0 License, Copyright © 2024

### Licenses of used libraries

See [library-license.txt](https://github.com/s-hirano-ist/s-private/blob/main/library-license.txt) for summary of used licenses.
