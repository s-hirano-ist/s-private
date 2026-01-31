# async-parallel: 書籍画像アップロードにおける非並列な非同期処理

## 概要
- **Rule**: `async-parallel`
- **Impact**: CRITICAL
- **File**: `app/src/application-services/books/add-books.core.ts`
- **Lines**: 52-61

## 問題

`addBooksCore`関数内で、オリジナル画像とサムネイル画像のアップロードが順次実行されている。これらの操作は互いに独立しており、並列実行が可能だが、現在はオリジナル画像のアップロードが完了するまでサムネイル画像のアップロードが開始されない。

画像アップロードは通常I/O操作であり、ネットワーク遅延が発生するため、並列化による効果が大きい。

### 現在のコード

```typescript
if (parsedData.hasImage) {
	await storageService.uploadImage(
		parsedData.path,
		parsedData.originalBuffer,
		false,
	);
	await storageService.uploadImage(
		parsedData.path,
		parsedData.thumbnailBuffer,
		true,
	);
}
```

## 解決策

`Promise.all()`を使用して、両方の画像アップロードを並列に実行する。これにより、アップロード時間が約半分に短縮される。

### 修正後のコード

```typescript
if (parsedData.hasImage) {
	await Promise.all([
		storageService.uploadImage(
			parsedData.path,
			parsedData.originalBuffer,
			false,
		),
		storageService.uploadImage(
			parsedData.path,
			parsedData.thumbnailBuffer,
			true,
		),
	]);
}
```

## 参考
- Vercel React Best Practices: `rules/async-parallel.md`
