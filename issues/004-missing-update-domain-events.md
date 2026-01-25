# Issue 004: 更新操作のドメインイベント欠落

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Low |
| **DDD原則** | ドメインイベントの完全性 |
| **対象ファイル** | 各ドメインの `events/` ディレクトリ |

## 現状

現在、各ドメインには `*CreatedEvent` と `*DeletedEvent` のみ存在し、更新操作に対するドメインイベントがありません。

```
packages/core/
├── articles/events/
│   ├── article-created-event.ts
│   └── article-deleted-event.ts    ← UpdatedEventがない
├── books/events/
│   ├── book-created-event.ts
│   └── book-deleted-event.ts       ← UpdatedEventがない
├── notes/events/
│   ├── note-created-event.ts
│   └── note-deleted-event.ts       ← UpdatedEventがない
└── images/events/
    ├── image-created-event.ts
    └── image-deleted-event.ts      ← UpdatedEventがない
```

## 問題点

- 重要なビジネス操作（OGメタデータ更新、Google Books情報更新など）がイベントとして記録されない
- 監査ログや通知などの副作用を追加する際に拡張が困難
- ドメインイベントの網羅性が不完全

## 考慮事項

本プロジェクトでは「意図的な逸脱002：イベントサブスクライバー省略」を採用しており、現時点ではイベントサブスクライバーを実装していません。そのため、Updatedイベントの追加は将来の拡張性のための準備となります。

## 改善案

重要な更新操作に対してドメインイベントを追加：

```typescript
// packages/core/articles/events/article-og-metadata-updated-event.ts
export class ArticleOgMetadataUpdatedEvent extends DomainEvent<{
  articleId: string;
  title: string;
  description: string;
  image: string | null;
}> {
  constructor(data: ArticleOgMetadataUpdatedPayload, caller: Caller) {
    super("article.og_metadata_updated", data, caller);
  }
}

// packages/core/books/events/book-google-info-updated-event.ts
export class BookGoogleInfoUpdatedEvent extends DomainEvent<{
  bookId: string;
  googleId: string;
  title: string;
}> {
  constructor(data: BookGoogleInfoUpdatedPayload, caller: Caller) {
    super("book.google_info_updated", data, caller);
  }
}
```

## 追加すべきイベント候補

| ドメイン | イベント名 | トリガー操作 |
|----------|------------|--------------|
| Articles | `ArticleOgMetadataUpdatedEvent` | OGメタデータ更新 |
| Articles | `ArticleExportedEvent` | 記事エクスポート |
| Books | `BookGoogleInfoUpdatedEvent` | Google Books情報更新 |
| Books | `BookExportedEvent` | 書籍エクスポート |
| Notes | `NoteExportedEvent` | ノートエクスポート |

## 影響範囲

- 各ドメインの `events/` ディレクトリに新規ファイル追加
- 対応するサービス/エンティティメソッドでイベント発行
- バレルファイル（`index.ts`）の更新

## 実装手順

1. 各ドメインにUpdatedイベントクラスを追加
2. 対応する操作でイベントを発行するよう修正
3. バレルファイルを更新
4. `pnpm build` で確認
