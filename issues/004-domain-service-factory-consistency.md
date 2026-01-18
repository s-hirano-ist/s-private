# Domain Service Factoryの一貫性

## 概要

Imagesドメインのみ他のドメインと異なるDomain Service生成パターンを使用しており、コードの一貫性が欠如している。

## 現状

```typescript
// Articles, Notes, Books - Factoryパターン
const articlesDomainService = domainServiceFactory.createArticlesDomainService();
const notesDomainService = domainServiceFactory.createNotesDomainService();
const booksDomainService = domainServiceFactory.createBooksDomainService();

// Images - 直接生成
const imagesDomainService = createImagesDomainService(queryRepository);
```

- Articles、Notes、Booksは`domainServiceFactory`を使用
- Imagesのみ直接生成関数を使用
- パターンの不統一による可読性・保守性の低下

## 改善案

ImagesもdomainServiceFactoryを使用するよう統一する。

### 実装手順

1. `packages/core/images/services/domain-service-factory.ts` を作成（または既存に追加）
2. `createImagesDomainService`をFactory内に移動
3. 呼び出し側を更新

```typescript
// 改善後
const imagesDomainService = domainServiceFactory.createImagesDomainService();
```

## 対象ファイル

- `packages/core/images/services/` - Factory実装
- `app/src/application-services/images/*.core.ts` - 呼び出し側

## 優先度

低

## 備考

- 動作に問題なし
- コード整理・一貫性向上が目的
- 新規メンバーの学習コスト軽減に寄与
