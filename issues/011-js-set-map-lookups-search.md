# js-set-map-lookups: 検索処理での非効率なルックアップ

## 概要
- **Rule**: `js-set-map-lookups`
- **Impact**: LOW-MEDIUM
- **File**: `app/src/application-services/search/search-content.ts`
- **Lines**: 91, 121, 149

## 問題

`searchContent`関数内で、`searchTypes.includes()`が3回呼び出されている。`searchTypes`は配列であり、`includes()`はO(n)の線形探索を行う。

同じ配列に対して複数回のルックアップを行う場合、事前にSetに変換することでO(1)のルックアップが可能になる。

### 現在のコード

```typescript
export async function searchContent(
	searchQuery: SearchQuery,
	userId: UserId,
): Promise<UnifiedSearchResults> {
	const { query, contentTypes, limit = 20 } = searchQuery;
	const searchTypes = contentTypes ?? ["articles", "books", "notes"];

	// ...

	// Search articles
	if (searchTypes.includes("articles")) {
		// ...
	}

	// Search books
	if (searchTypes.includes("books")) {
		// ...
	}

	// Search notes
	if (searchTypes.includes("notes")) {
		// ...
	}
	// ...
}
```

## 解決策

`searchTypes`をSetに変換してからルックアップを行う。これにより、3回のO(n)ルックアップがO(1)になる。

### 修正後のコード

```typescript
export async function searchContent(
	searchQuery: SearchQuery,
	userId: UserId,
): Promise<UnifiedSearchResults> {
	const { query, contentTypes, limit = 20 } = searchQuery;
	const searchTypes = new Set(contentTypes ?? ["articles", "books", "notes"]);

	// ...

	// Search articles
	if (searchTypes.has("articles")) {
		// ...
	}

	// Search books
	if (searchTypes.has("books")) {
		// ...
	}

	// Search notes
	if (searchTypes.has("notes")) {
		// ...
	}
	// ...
}
```

## 補足

現在のケースでは最大3つのコンテンツタイプしかないため、パフォーマンスへの実際の影響は軽微。しかし、このパターンを使用することで:

1. **意図の明確化**: 検索対象タイプの「セット」に含まれているかどうかを確認する意図が明確になる
2. **コードの一貫性**: プロジェクト全体でルックアップパターンを統一できる
3. **将来の拡張性**: 新しいコンテンツタイプが追加された場合にもスケールする

## 参考
- Vercel React Best Practices: `rules/js-set-map-lookups.md`
