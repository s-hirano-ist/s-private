# DDD-009: errorsディレクトリの配置修正

## 優先度
中

## 問題
`packages/core/errors/`がshared-kernelと同階層に独立して存在。
DDDではドメイン横断的なエラークラスはshared-kernelの一部として扱うべき。

## 現状
```
packages/core/
├── errors/
│   └── error-classes.ts
└── shared-kernel/
```

## 推奨
```
packages/core/
└── shared-kernel/
    ├── errors/
    │   └── error-classes.ts
    └── ...
```

## 対応内容
1. `packages/core/errors/` を `packages/core/shared-kernel/errors/` に移動
2. import パスを更新
3. テスト実行して動作確認
