# [INFO] バッチ処理のステータス遷移に関するDDD逸脱

## ステータス

- [x] 現状維持（情報共有用）

## 概要

バッチ処理におけるステータス遷移ロジックがエンティティ外部に存在している。これは意図的な設計判断であり、パフォーマンスを優先した正当な選択である。

## 現状

- ステータス遷移ロジックがドメインサービスに存在
- エンティティを経由せずに直接リポジトリでバッチ更新を実行
- `docs/domain-model.md`のDDD逸脱001として文書化済み

## DDD原則との比較

### 純粋なDDDアプローチ

```typescript
// エンティティでステータス遷移を管理
class Article {
  transitionToExported(): void {
    if (this.status !== 'UNEXPORTED') {
      throw new InvalidStatusTransitionError();
    }
    this.status = 'EXPORTED';
    this.addDomainEvent(new ArticleExportedEvent(this.id));
  }
}

// ドメインサービスで各エンティティを操作
async resetArticles(): Promise<void> {
  const articles = await this.repo.findByStatus('EXPORTED');
  for (const article of articles) {
    article.transitionToUnexported();
    await this.repo.save(article);
  }
}
```

### 現在の実装（パフォーマンス優先）

```typescript
// リポジトリで直接バッチ更新
async resetArticles(): Promise<BatchResult> {
  const count = await this.repo.batchUpdateStatus(
    { status: 'EXPORTED' },
    'UNEXPORTED'
  );
  return { updatedCount: count };
}
```

## 設計判断の理由

1. **パフォーマンス**: 大量レコードの個別ロード・保存は非効率
2. **メモリ効率**: 全エンティティをメモリにロードしない
3. **トレードオフの明示**: 文書化により意図を明確化

## 将来的な再検討条件

以下の条件が発生した場合、設計の見直しを検討する：

- [ ] ステータス遷移時に複雑なビジネスルールが追加された場合
- [ ] 遷移ごとにドメインイベントの発行が必須となった場合
- [ ] 監査ログで個別の遷移記録が必要となった場合

## 関連ドキュメント

- `docs/domain-model.md` - DDD逸脱001
- `packages/core/articles/services/articles-batch-domain-service.ts`

## 備考

このissueは情報共有を目的としており、対応は不要。
設計判断の経緯と将来の参考情報として保持する。
