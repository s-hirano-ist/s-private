# Server Actions に Middleware 導入

## 概要

Server Actionsに共通のmiddleware層を導入し、認証・認可・エラーハンドリング等の横断的関心事を統一的に処理する。

## 背景

- Next.jsのServer Actions middleware対応: https://github.com/vercel/next.js/pull/70961 の動向を確認
- `ErrorPermissionBoundary`の呼び出し方が関数形式であることの修正
- PR#1581のpermission wrapperの導入は強制できないため不可

## タスク

- [ ] Next.jsのServer Actions middleware対応状況を確認
- [ ] middleware層の設計（認証・認可・ログ・エラーハンドリング）
- [ ] `wrapServerSideErrorForClient` との統合
- [ ] 実装・テスト

## 元GH Issue

- GH#1607
