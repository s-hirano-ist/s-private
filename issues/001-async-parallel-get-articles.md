# async-parallel: 記事取得における非並列な非同期処理

## 概要
- **Rule**: `async-parallel`
- **Impact**: CRITICAL
- **File**: `app/src/application-services/articles/get-articles.ts`
- **Lines**: 63-70

## 問題

`_getArticles`関数内で、`articles`の取得と`totalCount`の取得が順次実行されている。これらの操作は互いに独立しており、並列実行が可能だが、現在は`articles`の取得が完了するまで`totalCount`の取得が開始されない。

これにより、全体のレイテンシが各操作のレイテンシの合計となり、パフォーマンスが低下する。

### 現在のコード

```typescript
const articles = await articlesQueryRepository.findMany(userId, status, {
	skip: currentCount,
	take: PAGE_SIZE,
	orderBy: { createdAt: "desc" },
	cacheStrategy,
});

const totalCount = await _getArticlesCount(userId, status);
```

## 解決策

`Promise.all()`を使用して、両方の非同期操作を並列に実行する。これにより、全体のレイテンシが最も遅い操作のレイテンシとなり、パフォーマンスが向上する。

### 修正後のコード

```typescript
const [articles, totalCount] = await Promise.all([
	articlesQueryRepository.findMany(userId, status, {
		skip: currentCount,
		take: PAGE_SIZE,
		orderBy: { createdAt: "desc" },
		cacheStrategy,
	}),
	_getArticlesCount(userId, status),
]);
```

## 参考
- Vercel React Best Practices: `rules/async-parallel.md`
