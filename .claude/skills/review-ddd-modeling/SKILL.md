---
name: review-ddd-modeling
description: Review the project domain modeling from DDD perspective.
globs:
  - "packages/core/**/*"
  - "app/src/application-services/**/*"
---

# Review DDD Modeling Skill

プロジェクトのドメインモデリングをドメイン駆動設計（DDD）の観点からレビューし、改善候補をissue化する。

## ワークフロー

### 1. ドメインモデル確認
- `packages/core/`のエンティティ、値オブジェクト、サービスを確認
- docs/domain-model.mdの設計を把握
- Prismaスキーマ（`packages/database/prisma/schema.prisma`）を参照

### 2. ドメインモデリング検証
以下の観点でドメインモデルをレビュー:

#### チェック項目（優先度順）

| Priority | Category | Check |
|----------|----------|-------|
| CRITICAL | 貧血ドメインモデル | エンティティがデータ構造のみでビジネスロジックを持たないか |
| CRITICAL | ドメインロジック漏洩 | ビジネスルールがApplication/Infrastructure層に漏れていないか |
| HIGH | 集約設計 | 集約ルートと集約境界が適切に定義されているか |
| HIGH | 不変条件 | エンティティの不変条件が適切に保護されているか |
| HIGH | エンティティ同一性 | IDによる同一性が適切に実装されているか |
| MEDIUM | 値オブジェクト | 概念的に値であるものが値オブジェクトとして実装されているか |
| MEDIUM | ドメインサービス | エンティティに属さないドメインロジックが適切に分離されているか |
| MEDIUM | ファクトリパターン | 複雑な生成ロジックがファクトリに分離されているか |
| LOW | ドメインイベント | 重要なドメインイベントが適切に表現されているか |
| LOW | ユビキタス言語 | コード内の命名がドメイン用語と一致しているか |

### 3. Issue作成
- 検出した各問題を`issues/`ディレクトリにmarkdownファイルとして作成
- ファイル名: `ddd-model-{番号}-{短い説明}.md`
- `ddd-model-001`から採番

## 制約
- **1問題 = 1issueファイル**: 複数の問題を1つのファイルにまとめない
- **具体的なコード参照**: 抽象的な指摘ではなく、具体的なファイル・行を示す
- **実装は行わない**: このスキルはレビューとissue作成のみ
- **既存issueと重複しない**: `issues/`の既存ファイルを確認

## 出力形式

```markdown
# Issue: {問題のタイトル}

## Metadata

| Field | Value |
|-------|-------|
| **DDD Pattern** | {違反しているパターン} |
| **Priority** | {CRITICAL/HIGH/MEDIUM/LOW} |
| **Domain** | {articles/notes/images/books/shared} |
| **Affected File** | `{file-path}` |

## Problem Description

{DDDのモデリング原則に照らした問題の説明}

### Current Code

\`\`\`typescript
// 問題のあるコード
\`\`\`

### Issues

1. {問題点1}
2. {問題点2}

## DDD Principle

{違反しているDDDパターンの説明}

## Proposed Solution

{DDDに基づく修正方針}

### Refactored Code

\`\`\`typescript
// 改善後のコード
\`\`\`

## Implementation Steps

1. [ ] ステップ1
2. [ ] ステップ2

## References

- docs/domain-model.md
- DDD Pattern: {該当するパターン名}
```

## DDDモデリングチェックポイント詳細

### 貧血ドメインモデル（Anemic Domain Model）
```typescript
// NG: データ構造のみ
class Article {
  id: string;
  title: string;
  status: string;
}

// OK: ビジネスロジックを持つ
class Article {
  private constructor(private props: ArticleProps) {}

  publish(): Result<void> {
    if (this.props.status !== 'draft') {
      return Result.fail('Already published');
    }
    this.props.status = 'published';
    return Result.ok();
  }
}
```

### 集約設計
- 集約ルートのみが外部から参照可能
- 集約内のエンティティは集約ルート経由でアクセス
- トランザクション境界 = 集約境界

### 値オブジェクト
```typescript
// NG: プリミティブ型の乱用
title: string;
email: string;

// OK: 値オブジェクト
title: Title;
email: Email;
```

### ドメインサービス
- 複数の集約にまたがる操作
- エンティティに属さないドメインロジック
- ステートレスな操作

### 不変条件の保護
```typescript
// NG: setterで直接変更可能
article.status = 'published';

// OK: メソッド経由で不変条件を検証
article.publish(); // 内部で状態遷移ルールを検証
```

## 注意事項
- 既存の`issues/`ファイルと重複しないよう確認する
- CRITICALとHIGHの問題を優先的に検出する
- プロジェクト固有の設計判断は尊重する（docs/domain-model.mdを参照）
- 過度な抽象化を避け、実用的な改善を提案する
