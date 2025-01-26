# s-private

![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)
![Build status](https://img.shields.io/github/actions/workflow/status/s-hirano-ist/s-private/ci.yaml?branch=main)
![GitHub stars](https://img.shields.io/github/stars/s-hirano-ist/s-private.svg)

> [!IMPORTANT]
> This is a contents dump and search app made by s-hirano. Some codes are not best practices due to trying experimental features and new techs.

**Main Framework** - [Next.js](https://nextjs.org/)  
**Type Checking** - [TypeScript](https://www.typescriptlang.org/)  
**Package Manager** - [pnpm](https://pnpm.io/)  
**Styling** - [Shadcn/ui](https://ui.shadcn.com/)  
**Database** - [PostgreSQL](https://www.postgresql.org/)  
**Object Storage** [MinIO](https://min.io/)  
**ORM** - [Prisma](https://www.prisma.io/)  
**Vulnerabilities Checks** - [npm-audit](https://docs.npmjs.com/cli/v10/commands/npm-audit) & [Dependabot alert](https://docs.github.com/ja/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)  
**Rendering Checks** -[React Scan](https://github.com/aidenybai/react-scan)  

## 初期設定

```bash
git clone --recursive https://github.com/s-hirano-ist/s-private.git
cd s-private
```

## Docker Imageのビルドとプッシュ

MainブランチにPRがpushされたら自動的に[DockerHub](https://hub.docker.com/repository/docker/s0hirano/s-private/general)にイメージがpushされる仕組み。

## 起動方法

### 開発環境

```bash
docker compose up --build -d
pnpm dev
```

### 本番環境

[s-tools/s-private](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

### Storybook

[s-tools/s-storybook](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

## 🪝 Tags & Realease

Add commits to main branch using `git-cz` command will automatically create a tag and release.

## 📜 License

Licensed under the AGPL-3.0 License, Copyright © 2024

### Licenses of used libraries

See [library-license.txt](https://github.com/s-hirano-ist/s-private/blob/main/library-license.txt) for summary of used licenses.

## 🔒 Security

[s-hirano.com/summary/coding-security](https://s-hirano.com/summary/coding-security)を参照。
