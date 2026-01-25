# 007: Dependency-Cruiserにクロスドメイン禁止ルールを追加

## 概要

クロスドメインimport禁止は実装規約として守られているが、dependency-cruiserに明示的なルールがない。静的解析ツールでの強制を追加することで、将来的な保守性を向上させる。

## 現状

- **ファイル**: `.dependency-cruiser.cjs`
- クロスドメインimportは実際には発生していない（実装で守られている）
- しかし静的解析ツールでの強制がない

## 問題点

- 新規メンバーがルールを知らずにクロスドメインimportを追加する可能性
- CIで自動検出できない
- ルールが暗黙的で文書化されていない

## 推奨される解決策

`.dependency-cruiser.cjs` に以下のようなルールを追加:

```javascript
{
  name: "no-cross-domain-import",
  severity: "error",
  comment: "ドメイン間の直接importを禁止（shared-kernelは許可）",
  from: {
    path: "^packages/core/(articles|books|notes|images)/"
  },
  to: {
    path: "^packages/core/(articles|books|notes|images)/",
    pathNot: [
      // 同一ドメイン内は許可
      "^packages/core/\\1/",
      // shared-kernelは許可
      "^packages/core/shared-kernel/"
    ]
  }
}
```

## 対象ドメイン

- `packages/core/articles/`
- `packages/core/books/`
- `packages/core/notes/`
- `packages/core/images/`

## 許可される依存

- 同一ドメイン内のimport
- `packages/core/shared-kernel/` からのimport

## 優先度

中

## 関連ドキュメント

- [docs/architecture.md](../docs/architecture.md)
- [docs/domain-model.md](../docs/domain-model.md)
