# js-cache-function-results: 検索ソート関数内での重複した文字列変換

## 概要
- **Rule**: `js-cache-function-results`
- **Impact**: HIGH
- **File**: `app/src/application-services/search/search-content.ts`
- **Lines**: 168-187

## 問題

`searchContent`関数内のソート比較関数で、`query.toLowerCase()`が毎回の比較ごとに呼び出されている。ソート処理はO(n log n)の比較を行うため、この変換がn log n回実行される。

`query`は検索処理中に変化しないため、事前に1回だけ変換してキャッシュすべき。

### 現在のコード

```typescript
results.sort((a, b) => {
	// Simple relevance scoring based on title vs content matches
	const aInTitle = a.title.toLowerCase().includes(query.toLowerCase())
		? 2
		: 0;
	const bInTitle = b.title.toLowerCase().includes(query.toLowerCase())
		? 2
		: 0;
	const aInSnippet = a.snippet.toLowerCase().includes(query.toLowerCase())
		? 1
		: 0;
	const bInSnippet = b.snippet.toLowerCase().includes(query.toLowerCase())
		? 1
		: 0;

	const aScore = aInTitle + aInSnippet;
	const bScore = bInTitle + bInSnippet;

	return bScore - aScore;
});
```

## 解決策

ソートループの外で`query.toLowerCase()`を事前に計算してキャッシュする。これにより、文字列変換が1回のみ実行される。

### 修正後のコード

```typescript
const queryLower = query.toLowerCase();

results.sort((a, b) => {
	// Simple relevance scoring based on title vs content matches
	const aInTitle = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
	const bInTitle = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
	const aInSnippet = a.snippet.toLowerCase().includes(queryLower) ? 1 : 0;
	const bInSnippet = b.snippet.toLowerCase().includes(queryLower) ? 1 : 0;

	const aScore = aInTitle + aInSnippet;
	const bScore = bInTitle + bInSnippet;

	return bScore - aScore;
});
```

## 参考
- Vercel React Best Practices: `rules/js-cache-function-results.md`
