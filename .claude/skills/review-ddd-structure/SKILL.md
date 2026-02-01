---
name: review-ddd-structure
description: Review the project directory structure from DDD perspective.
globs:
  - "packages/core/**/*"
  - "app/src/**/*"
---

# Review DDD Structure Skill

プロジェクトのディレクトリ構成をドメイン駆動設計（DDD）の観点からレビューし、改善候補をissue化する。

## ワークフロー

### 1. 構成確認
- プロジェクトのディレクトリ構成を確認
- CLAUDE.mdの設計方針を把握
- docs/architecture.mdの詳細を確認

### 2. DDDレイヤー検証
以下の観点でディレクトリ構成をレビュー:

#### レイヤー分離
- **ドメイン層** (`packages/core/`): entities, repositories, services, shared-kernel
- **アプリケーション層** (`app/src/application-services/`): ユースケース
- **インフラ層** (`app/src/infrastructures/`): 技術的実装
- **プレゼンテーション層** (`app/src/app/`): UIコンポーネント

#### チェック項目（優先度順）

| Priority | Category | Check |
|----------|----------|-------|
| CRITICAL | 依存方向 | 下位レイヤーが上位レイヤーに依存していないか |
| CRITICAL | ドメイン汚染 | ドメイン層にインフラ依存（Prisma等）が混入していないか |
| HIGH | 境界づけられたコンテキスト | 各ドメイン（articles, notes, images, books）が独立しているか |
| HIGH | Cross-domain Import | ドメイン間の不正なimportがないか |
| MEDIUM | リポジトリパターン | インターフェースがドメイン層、実装がインフラ層にあるか |
| MEDIUM | 集約境界 | 集約ルートが適切に定義されているか |
| MEDIUM | 値オブジェクト | 適切な値オブジェクトが定義されているか |
| LOW | Shared Kernel | 共有カーネルの使用が適切か |
| LOW | ファイル配置 | 各ファイルが適切なディレクトリに配置されているか |

### 3. Issue作成
- 検出した各問題を`issues/`ディレクトリにmarkdownファイルとして作成
- ファイル名: `ddd-{番号}-{短い説明}.md`
- `ddd-001`から採番

## 制約
- **1問題 = 1issueファイル**: 複数の問題を1つのファイルにまとめない
- **具体的なパス参照**: 抽象的な指摘ではなく、具体的なディレクトリ・ファイルを示す
- **実装は行わない**: このスキルはレビューとissue作成のみ
- **既存issueと重複しない**: `issues/`の既存ファイルを確認

## 出力形式

```markdown
# Issue: {問題のタイトル}

## Metadata

| Field | Value |
|-------|-------|
| **DDD Principle** | {違反している原則} |
| **Priority** | {CRITICAL/HIGH/MEDIUM/LOW} |
| **Layer** | {Domain/Application/Infrastructure/Presentation} |
| **Affected Path** | `{directory-or-file-path}` |

## Problem Description

{DDDの原則に照らした問題の説明}

### Current Structure

```
{現在のディレクトリ構造}
```

### Issues

1. {問題点1}
2. {問題点2}

## DDD Principle

{違反しているDDD原則の説明}

## Proposed Solution

{DDDに基づく修正方針}

### Recommended Structure

```
{推奨されるディレクトリ構造}
```

## Implementation Steps

1. [ ] ステップ1
2. [ ] ステップ2

## References

- docs/architecture.md
- DDD原則: {該当する原則名}
```

## DDDチェックポイント詳細

### 依存方向の原則
```
Presentation → Application → Domain ← Infrastructure
                    ↓
               Domain (中心)
```
- ドメイン層は他のレイヤーに依存しない
- インフラ層はドメイン層のインターフェースに依存する（依存性逆転）

### 境界づけられたコンテキスト
- articles, notes, images, booksは独立したコンテキスト
- コンテキスト間の通信は明示的なインターフェース経由

### 集約パターン
- 集約ルートのみが外部からアクセス可能
- 集約内のエンティティは集約ルート経由でのみ操作

## 注意事項
- 既存の`issues/`ファイルと重複しないよう確認する
- CRITICALとHIGHの問題を優先的に検出する
- プロジェクト固有の設計判断は尊重する（docs/を参照）
