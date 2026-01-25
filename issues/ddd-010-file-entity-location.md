# DDD-010: file-entity.tsの配置検討

## 優先度
低

## 問題
`file-entity.ts`の値オブジェクト（Path, ContentType, FileSize）はimagesドメインのみが使用。
shared-kernelは「複数ドメインで共有される」ものを配置する場所。

## 現状
```
packages/core/shared-kernel/entities/
├── common-entity.ts
└── file-entity.ts
```

## 検討事項
- 将来的にbooksやnotesでファイル添付機能を追加予定があるか？
- 追加予定がなければimagesドメインへの移動を推奨

## 推奨（使用予定がない場合）
```
packages/core/images/entities/
├── image-entity.ts
└── file-value-objects.ts
```
