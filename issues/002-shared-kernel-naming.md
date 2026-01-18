# 共通層の命名をDDD用語に合わせる

## 概要
現在の `common/` ディレクトリ名をDDDの標準用語である「Shared Kernel」に合わせることを検討。

## 現状
```
packages/core/common/
├── entities/
├── repositories/
├── services/
├── events/
└── types/
```

## DDDの原則
複数のBounded Context間で共有される概念は「Shared Kernel」と呼ばれる。
- Id, UserId, Status, CreatedAt などはまさにShared Kernelの概念

## 改善案
`packages/core/common/` → `packages/core/shared-kernel/`

## 影響範囲
- パス変更に伴うimport文の更新（packages/core内およびapp/src内）
- tsconfig.jsonのpaths設定の更新

## 優先度
低（意図は現状でも明確、リネームコストに見合う価値があるか要検討）

## 検討事項
- チーム全員がDDD用語に馴染みがあるか
- `common` の方が直感的に理解しやすい可能性もある
