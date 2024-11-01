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
**Vulnerabilities Check** - [npm-audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)  [Dependabot alert](https://docs.github.com/ja/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)  

## 初期設定

```bash
git clone --recursive https://github.com/s-hirano-ist/s-private.git
cd s-private
```

## DockerImageのビルドとプッシュ

詳細は[DockerHub](https://hub.docker.com/repository/docker/s0hirano/s-private/general)を参照願う。

```bash
docker login
bash ./docker/docker-push.sh
```

## 起動方法

### 開発環境

```bash
docker compose --profile dev up --build -d
pnpm dev
```

### 本番環境

[s-tools/s-private](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

### Storybook

[s-tools/s-storybook](https://github.com/s-hirano-ist/s-tools/tree/main/s-private)を参照。

## 🪝 Tags & Realease

Add commits to main branch using `git-cz` command will automatically create a tag and release.

## 📜 License

Licensed under the MIT License, Copyright © 2024

### Licenses of used libraries

See [library-license.txt](https://github.com/s-hirano-ist/s-private/blob/main/library-license.txt) for summary of used licenses.

## 🔒 Security

[s-hirano.com/summary/coding-security](https://s-hirano.com/summary/coding-security)を参照。

## その他

### codemod

[react codemod](https://github.com/reactjs/react-codemod)による変更を[shadcn ui](https://ui.shadcn.com/)に実施。

```bash
npx codemod react/19/remove-context-provider --target src/
npx codemod react/19/remove-forward-ref --target src/
npx codemod react/19/use-context-hook --target src/
npx codemod react/19/replace-act-import --target src/
npx codemod react/19/replace-string-ref --target src/
npx codemod react/19/replace-use-form-state --target src/
npx codemod react/19/replace-reactdom-render --target src/
# npx codemod react/create-element-to-jsx --target src/
npx codemod react/error-boundaries --target src/
npx codemod react/findDOMNode --target src/
npx codemod react/manual-bind-to-arrow --target src/
npx codemod react/pure-component --target src/
npx codemod react/pure-render-mixin --target src/
npx codemod react/React-PropTypes-to-prop-types --target src/
npx codemod react/rename-unsafe-lifecycles --target src/
npx codemod react/react-to-react-dom --target src/
npx codemod react/React-DOM-to-react-dom-factories --target src/
npx codemod react/ReactNative-View-propTypes --target src/
npx codemod react/update-react-imports --target src/
```
