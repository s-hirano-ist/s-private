# DDD改善タスク一覧

## 概要
DDDの原則に基づき、全ドメイン（articles, notes, images, books）の実装を改善する。現在の良好な実践を維持しつつ、ドメインイベント、集約ルート、仕様パターンの導入により、よりビジネスロジックを表現力豊かに実装する。

## 1. 課題分析

### 1.2 改善が必要な箇所（❌ 未実装）

#### 1. エンティティの振る舞いの欠如
- **現状**: `src/domains/*/entities/*-entity.ts`でファクトリー関数のみ（例：`noteEntity.create`）
- **問題**: ビジネスロジックがドメイン外に散在、エンティティに`export()`、`publish()`、`archive()`等のメソッドなし
- **改善案**: エンティティクラスでの振る舞い実装
- **影響度**: 🔴 **高** - ドメインロジックの中核

#### 2. ユビキタス言語の整合性問題
- **現状**: `src/domains/common/entities/common-entity.ts:6`で`UNEXPORTED`/`EXPORTED`ステータス
- **問題**: 技術的な用語でビジネス用語と乖離、アプリケーション層でもハードコーディング（例：`addBooks.ts:39`）
- **改善案**: `DRAFT`/`PUBLISHED`への変更
- **影響度**: 🟡 **中** - 全ドメイン共通の概念

#### 3. ドメインサービスの命名と責務不明確
- **現状**: `BooksDomainService`、`NotesDomainService`等の汎用的命名
- **問題**: 具体的な責務が不明瞭（実際は重複チェックのみ）
- **改善案**: `BookDuplicationChecker`、`NoteDuplicationChecker`等への変更
- **影響度**: 🟡 **中** - 可読性とドメイン表現力

#### 4. ドメインサービスのインスタンス化の問題
- **現状**: アプリケーションサービスで直接インスタンス化（例：`addBooks.ts:18`）
- **問題**: テスタビリティの低下、依存関係の管理が分散
- **改善案**: DIコンテナまたはファクトリーパターンの導入
- **影響度**: 🟡 **中** - テスト容易性

#### 5. リポジトリの責務範囲の問題
- **現状**: リポジトリがログ出力も担当（確認要：infrastructures層のリポジトリ実装）
- **問題**: 単一責任の原則に違反
- **改善案**: イベント駆動でのログ分離
- **影響度**: 🟡 **中** - 責務分離

#### 6. 集約の境界が不明確
- **現状**: エンティティが単体で存在、集約ルートが明確でない
- **問題**: トランザクション境界が不明瞭
- **改善案**: 集約の導入とトランザクション境界の明確化
- **影響度**: 🟠 **低** - 現在は問題顕在化せず

#### 7. ドメインイベントの欠如
- **現状**: イベント駆動の仕組みがない、副作用が直接実装
- **問題**: 関心事の分離が不十分、横断的関心事の結合
- **改善案**: ドメインイベントの導入
- **影響度**: 🟠 **低** - 現在は問題顕在化せず

#### 8. トランザクション管理の不在
- **現状**: 明示的なトランザクション境界がない
- **問題**: 部分的な失敗時の整合性保証なし
- **改善案**: Unit of Workパターンの導入
- **影響度**: 🟠 **低** - 現在は単純なCRUD操作のみ

### 1.3 新たに発見された課題（🆕 追加検出）

#### 1. revalidateTagでのハードコーディング問題
- **現状**: `src/application-services/books/add-books.ts:39-40`で`books_UNEXPORTED_${userId}`等をハードコーディング
- **問題**: ステータス値の変更時に修正漏れのリスク、文字列の分散管理
- **改善案**: 定数化またはドメインオブジェクトからの動的生成
- **影響度**: 🔴 **高** - 保守性とバグリスク

#### 2. エンティティファクトリーでの例外処理不統一
- **現状**: 各エンティティで例外ハンドリングパターンが微妙に異なる
- **問題**: エラー処理の一貫性不足、予測しにくい例外動作
- **改善案**: 共通の例外処理パターンの確立
- **影響度**: 🟡 **中** - 保守性とデバッグ容易性

#### 3. 値オブジェクトのディレクトリ分離未実施
- **現状**: 値オブジェクトがエンティティファイル内に混在（例：`NoteTitle`、`Markdown`が`note-entity.ts`内）
- **問題**: 値オブジェクトの再利用性低下、ファイル肥大化
- **改善案**: `src/domains/*/value-objects/`ディレクトリへの分離
- **影響度**: 🟡 **中** - ファイル構造の明確化

## 変更しない項目

### `UNEXPORTED`/`EXPORTED` の命名

- **理由**: 関係者間でこのドメインでの共通認識がすでにあるため

### ドメインサービスの命名改善
- **対象**:
  - `BooksDomainService` → `BookDuplicationChecker`
  - `NotesDomainService` → `NoteDuplicationChecker`
  - `ArticlesDomainService` → `ArticleDuplicationChecker`
- **理由**: 今後このファイルに追加のドメインサービスを追加予定であるため

### エンティティへの振る舞い追加
- **変更内容**:
  - ファクトリー関数をクラスメソッドに変換
  - ビジネスロジックをエンティティに移動
  - `export()`, `publish()`, `archive()`等のメソッド追加
- **理由**: 別タスクで追加中なため

### 値オブジェクトのディレクトリ分離
- **変更内容**: `src/domains/*/value-objects/`への分離
- **理由**: 可読性と1ファイルでのメリットが大きいため

## 2. 実装タスク（現実的優先度順）

### 🔥 Phase 0: 緊急度高・影響大（すぐに実施すべき）

#### タスク1: revalidateTagハードコーディング解消
- **対象**: 全アプリケーションサービスの`revalidateTag`呼び出し
- **変更内容**: ステータス値の定数化・動的生成
- **理由**: 🔴 **緊急** - ステータス変更時の修正漏れリスク、保守性の致命的問題

### 🟡 Phase 1: 基盤改善（中期実施・効果確実）

#### タスク6: ドメインサービスファクトリーの導入
- **実装箇所**: `src/domains/*/factories/*-domain-service.factory.ts`
- **内容**: ドメインサービスのファクトリーパターン実装
- **効果**: テスタビリティの向上、依存関係の一元管理

#### タスク7: リポジトリからのログ分離
- **変更内容**: リポジトリは永続化のみに集中
- **実装**: イベント駆動でのログ記録責務移動

### 🔵 Phase 3: 上級パターン（将来検討・現在は不要）

#### タスク8: ドメインイベント基盤の実装
- **ベースイベントクラス**: `src/domains/common/events/domain-event.ts`
- **イベントバス**: `src/domains/common/events/event-bus.ts`
- **各ドメインイベント**: `*CreatedEvent`, `*PublishedEvent`等
- **理由**: 現在のシンプルなCRUD操作では過度な抽象化
- **検討時期**: 複雑なビジネスロジックが増加した時点

#### タスク9: 集約ルートの実装
- **各ドメイン集約**: `*Aggregate`クラス群
- **集約リポジトリ**: 集約単位での永続化
- **理由**: 現在のエンティティ単位操作で十分
- **検討時期**: 複数エンティティの整合性管理が必要になった時点

#### タスク10: 仕様パターンの導入
- **ベース仕様**: `src/domains/common/specifications/specification.ts`
- **ドメイン固有仕様**: 複雑なビジネスルール表現
- **理由**: 現在のバリデーションロジックで充足
- **検討時期**: 複雑な条件分岐が増加した時点

#### タスク11: Unit of Workパターン
- **Unit of Work**: `src/infrastructures/persistence/unit-of-work.ts`
- **理由**: 現在は単一エンティティ操作中心
- **検討時期**: 複数テーブル横断処理が増加した時点

#### タスク12: CQRS・高度パターン
- **コマンド/クエリ分離**: アプリケーションサービス再構成
- **理由**: 現在の読み書き要求で十分
- **検討時期**: パフォーマンス要件が厳しくなった時点

## 3. ドメイン別具体的タスク

### 3.1 notesドメイン（旧contents）

#### 集約設計
- **NoteAggregate**: ノート本体、コメント、タグの管理
- **不変条件**: 公開済みノートの編集制限、タイトル重複チェック

#### イベント
- `NoteCreatedEvent`, `NotePublishedEvent`, `NoteArchivedEvent`

#### 仕様
- `PublishableNoteSpec`: 最小文字数、タイトル要件
- `EditableNoteSpec`: ステータスベースの編集可否
- `DuplicateTitleSpec`: タイトル重複チェック

### 3.2 articlesドメイン（旧news）

#### 集約設計
- **ArticleAggregate**: 記事本体、カテゴリ、OGメタデータの管理
- **不変条件**: カテゴリの有効性、URL重複チェック

#### イベント
- `ArticleCreatedEvent`, `ArticlePublishedEvent`, `ArticleCategorizedEvent`

#### 仕様
- `PublishableArticleSpec`: OGメタデータ存在、カテゴリ必須
- `CategorizableArticleSpec`: カテゴリ割り当て可否
- `DuplicateUrlSpec`: URL重複チェック

### 3.3 booksドメイン

#### 集約設計
- **BookAggregate**: 書籍情報、レビュー、GoogleBooks連携データの管理
- **不変条件**: ISBN妥当性、重複登録防止

#### イベント
- `BookCreatedEvent`, `BookReviewedEvent`, `BookMetadataUpdatedEvent`

#### 仕様
- `PublishableBookSpec`: 必要メタデータの存在
- `DuplicateIsbnSpec`: ISBN重複チェック（現BookDuplicationChecker）
- `ReviewableBookSpec`: レビュー投稿可否

### 3.4 imagesドメイン

#### 集約設計
- **ImageAggregate**: 画像メタデータ、タグ、MinIO連携データの管理
- **不変条件**: ファイル形式妥当性、サイズ制限

#### イベント
- `ImageUploadedEvent`, `ImageProcessedEvent`, `ImageTaggedEvent`

#### 仕様
- `UploadableImageSpec`: ファイル形式、サイズチェック
- `ProcessableImageSpec`: 画像処理可否
- `TaggableImageSpec`: タグ付け可否

## 4. 推奨される改善後のディレクトリ構造

```
src/
├── domains/                      # ドメイン層
│   ├── notes/
│   │   ├── aggregates/          # 集約
│   │   │   └── note.aggregate.ts
│   │   ├── entities/            # エンティティ
│   │   │   └── note.entity.ts
│   │   ├── value-objects/       # 値オブジェクト
│   │   │   ├── note-title.vo.ts
│   │   │   └── markdown.vo.ts
│   │   ├── repositories/        # リポジトリインターフェース
│   │   ├── services/            # ドメインサービス
│   │   ├── events/              # ドメインイベント
│   │   ├── factories/           # ファクトリー
│   │   └── specifications/      # 仕様オブジェクト
│   ├── articles/                # 同様の構造
│   ├── books/                   # 同様の構造
│   ├── images/                  # 同様の構造
│   └── common/                  # 共有ドメインオブジェクト
│       ├── events/
│       ├── specifications/
│       └── value-objects/
├── application-services/         # アプリケーション層
│   ├── notes/
│   │   ├── commands/            # コマンド（CQRSパターン）
│   │   ├── queries/             # クエリ（CQRSパターン）
│   │   └── handlers/            # イベントハンドラー
│   └── ...
├── infrastructures/              # インフラストラクチャ層
│   ├── persistence/             # 永続化
│   ├── di/                      # 依存性注入
│   └── events/                  # イベントバス実装
└── ...
```

## 5. テスト戦略

### 5.1 ユニットテスト
- ドメインイベントのテスト
- 集約のテスト（不変条件の検証）
- 仕様のテスト（ビジネスルールの検証）

### 5.2 統合テスト
- アプリケーションサービステスト（イベント発行の検証）
- リポジトリテスト（永続化の検証）
