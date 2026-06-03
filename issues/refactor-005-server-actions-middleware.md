# Server Actions に Middleware 導入

## 概要

Server Actionsに共通のmiddleware層を導入し、認証(`requireAuth`)・ログ・エラーハンドリング等の横断的関心事を統一的に処理する。なお認可(RBAC/permission)はすでに廃止済み（authn-onlyモデル）であり、サインイン済みユーザーが所有者として全操作可能。エラーハンドリングも既存の`wrapServerSideErrorForClient`（`app/src/common/error/error-wrapper.ts`）で中央化済みのため、middlewareはそれを再利用する。

## 背景

- Next.jsのServer Actions middleware対応: https://github.com/vercel/next.js/pull/70961 の動向を確認（外部トラッキング。Next.js 16.2.6に対して最新状況を再確認すること）
- authn-onlyモデルのため、各Server Actionが手動で`await requireAuth()`を呼んでから`.core`に委譲しており（例: `app/src/application-services/articles/add-article.ts`）、この重複を中央化したい

## タスク

- [ ] Next.jsのServer Actions middleware対応状況を確認
- [ ] middleware層の設計（認証(`requireAuth`)・ログ。エラーハンドリングは既存の`wrapServerSideErrorForClient`を再利用）
- [ ] `wrapServerSideErrorForClient` との統合
- [ ] 実装・テスト

## 元GH Issue

- GH#1607
