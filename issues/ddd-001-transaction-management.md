# バッチ処理にトランザクション管理を追加

## ステータス

- [ ] 対応中

## 概要

バッチ処理における複合操作のトランザクション境界が不明確であり、部分的な失敗時のロールバックが未定義となっている。

## 現状

`ArticlesBatchDomainService.resetArticles`では、複数のステップで構成される操作を実行している：

1. Step 1: EXPORTEDな記事をUNEXPORTEDに変更
2. Step 2: 最終更新記事をEXPORTEDに変更

これらの操作間でトランザクション境界が不明確。

## 問題点

- Step 1が成功した後にStep 2で失敗した場合、ロールバックが実行されない
- 中間状態でデータが不整合になる可能性がある
- 複数のリポジトリ操作を跨ぐトランザクション管理が存在しない

## 対象ファイル

- `packages/core/articles/services/articles-batch-domain-service.ts`
- `packages/core/shared-kernel/repositories/batch-command-repository.interface.ts`

## 改善案

Prismaの`$transaction`を活用したトランザクションマネージャーを導入する。

### 実装方針

1. **TransactionManager インターフェースの定義**
   ```typescript
   interface TransactionManager {
     execute<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T>;
   }
   ```

2. **BatchCommandRepository にトランザクション対応メソッドを追加**
   ```typescript
   interface BatchCommandRepository<TEntity> {
     // 既存メソッド
     batchUpdateStatus(ids: string[], status: Status): Promise<number>;

     // トランザクション対応メソッド
     batchUpdateStatusInTransaction(
       tx: TransactionContext,
       ids: string[],
       status: Status
     ): Promise<number>;
   }
   ```

3. **ドメインサービスでのトランザクション利用**
   ```typescript
   async resetArticles(): Promise<BatchResult> {
     return this.transactionManager.execute(async (tx) => {
       const step1 = await this.repo.batchUpdateStatusInTransaction(tx, ...);
       const step2 = await this.repo.batchUpdateStatusInTransaction(tx, ...);
       return { step1, step2 };
     });
   }
   ```

## 受け入れ基準

- [ ] TransactionManagerインターフェースが定義されている
- [ ] BatchCommandRepositoryがトランザクション対応している
- [ ] ArticlesBatchDomainServiceがトランザクション内で操作を実行する
- [ ] 部分的な失敗時に全体がロールバックされる
- [ ] ユニットテストで失敗ケースが検証されている

## 優先度

中 - データ整合性に関わる問題だが、現在の運用では問題が顕在化していない

## 関連ドキュメント

- `docs/architecture.md`
- `docs/domain-model.md`
