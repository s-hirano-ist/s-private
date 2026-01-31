# async-parallel: 画像アップロードにおける非並列な非同期処理

## 概要
- **Rule**: `async-parallel`
- **Impact**: CRITICAL
- **File**: `app/src/application-services/images/add-image.core.ts`
- **Lines**: 63-64

## 問題

`addImageCore`関数内で、オリジナル画像とサムネイル画像のアップロードが順次実行されている。これらの操作は互いに独立しており、並列実行が可能だが、現在はオリジナル画像のアップロードが完了するまでサムネイル画像のアップロードが開始されない。

画像アップロードはI/O操作であり、MinIOへのネットワーク通信が発生するため、並列化による効果が大きい。

### 現在のコード

```typescript
await storageService.uploadImage(image.path, originalBuffer, false);
await storageService.uploadImage(image.path, thumbnailBuffer, true);
```

## 解決策

`Promise.all()`を使用して、両方の画像アップロードを並列に実行する。これにより、アップロード時間が約半分に短縮される。

### 修正後のコード

```typescript
await Promise.all([
	storageService.uploadImage(image.path, originalBuffer, false),
	storageService.uploadImage(image.path, thumbnailBuffer, true),
]);
```

## 参考
- Vercel React Best Practices: `rules/async-parallel.md`
