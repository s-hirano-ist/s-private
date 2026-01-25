# DDD-011: インフラ層commonディレクトリの命名改善

## 優先度
低

## 問題
`common`より`shared`の方が意図が明確。
また、ストレージ関連サービスの配置が分散している。

## 現状
```
app/src/infrastructures/
├── common/
│   ├── cache/
│   └── services/
│       └── minio-storage-service.ts
├── books/
│   └── services/
│       └── books-storage-service.ts
```

## 推奨
```
app/src/infrastructures/
├── shared/
│   ├── cache/
│   └── storage/
│       └── minio-storage-service.ts
```
