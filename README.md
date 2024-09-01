# s-private

![License](https://img.shields.io/badge/license-MIT-blue)
![Build status](https://img.shields.io/github/actions/workflow/status/s-hirano-ist/s-private/build.yaml?branch=main)
![GitHub stars](https://img.shields.io/github/stars/s-hirano-ist/s-private.svg)

> [!IMPORTANT]
> This is a sample app made by s-hirano.

**Main Framework** - [Next.js](https://nextjs.org/)  
**Type Checking** - [TypeScript](https://www.typescriptlang.org/)  
**Package Manager** - [pnpm](https://pnpm.io/)  
**Styling** - [Shadcn/ui](https://ui.shadcn.com/)  
**Database** - [PostgreSQL](https://www.postgresql.org/)  
**ORM** - [Prisma](https://www.prisma.io/)  

## 初期設定

```bash
git clone --recursive https://github.com/s-hirano-ist/s-private.git
cd s-private
```

## 起動方法

### 開発環境

```bash
docker compose --profile dev up --build -d
pnpm dev
```

### 本番環境

```bash
docker compose --profile prod up --build -d
```

## その他

### 容量圧迫時

```bash
docker builder prune
```

## 🪝 Tags & Realease

1. Run one of the following commands

```bash
pnpm release:major
pnpm release:minor
pnpm release:patch
```

## 📜 License

Licensed under the MIT License, Copyright © 2024

### Licenses of used libraries

```txt
├─ MIT: 80
├─ Apache-2.0: 6
├─ ISC: 5
├─ BSD-2-Clause: 3
├─ MIT OR Apache-2.0: 1
├─ Unlicense: 1
├─ BSD-3-Clause: 1
└─ Custom: https://github.com/s-hirano-ist/s-private.git: 1
```

last updated on 30th of August 2024.
├─ MIT: 87
├─ Apache-2.0: 6
├─ ISC: 5
├─ BSD-2-Clause: 3
├─ MIT OR Apache-2.0: 1
├─ Unlicense: 1
├─ BSD-3-Clause: 1
└─ ISC*: 1

