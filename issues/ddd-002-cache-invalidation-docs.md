# キャッシュ無効化マトリクスをドキュメントに追加

## ステータス

- [ ] 対応中

## 概要

バッチ処理時のキャッシュ無効化戦略が文書化されておらず、ステータス遷移時に無効化すべきタグが不明確となっている。

## 現状

- キャッシュタグの命名規則は存在する
- しかし、どの操作でどのタグを無効化すべきかが明文化されていない
- 新規開発者がキャッシュ無効化漏れを起こすリスクがある

## 問題点

- ステータス遷移時に無効化すべきタグの一覧が存在しない
- バッチ処理での大量更新時の無効化戦略が不明
- カテゴリや関連エンティティへの影響が明確でない

## 対象ファイル

- `docs/architecture.md`
- `docs/cache.md` (新規作成の可能性あり)

## 改善案

以下のキャッシュ無効化マトリクスを`docs/architecture.md`に追加する。

### キャッシュ無効化マトリクス

#### 単一エンティティ操作

| Operation | 無効化するタグ | 備考 |
|-----------|---------------|------|
| create | `{domain}_{status}`, `{domain}_count_{status}`, `categories` | 新規作成時 |
| update | `{domain}_{id}`, `{domain}_{old_status}`, `{domain}_{new_status}` | ステータス変更時 |
| delete | `{domain}_{id}`, `{domain}_{status}`, `{domain}_count_{status}` | 削除時 |

#### バッチ操作

| Operation | 無効化するタグ | 備考 |
|-----------|---------------|------|
| batch reset | `articles_UNEXPORTED`, `articles_LAST_UPDATED`, `articles_EXPORTED`, `articles_count_*` | 全ステータスに影響 |
| batch export | `{domain}_UNEXPORTED`, `{domain}_EXPORTED`, `{domain}_count_*` | ステータス遷移 |
| batch delete | `{domain}_*` | 全キャッシュ無効化 |

#### ステータス遷移時の無効化ルール

```
UNEXPORTED → EXPORTED:
  - 無効化: articles_UNEXPORTED, articles_EXPORTED, articles_count_UNEXPORTED, articles_count_EXPORTED

EXPORTED → UNEXPORTED (batch reset):
  - 無効化: articles_UNEXPORTED, articles_EXPORTED, articles_LAST_UPDATED, articles_count_*
```

### 実装例

```typescript
// キャッシュ無効化ヘルパー
function invalidateOnStatusChange(
  domain: string,
  oldStatus: Status,
  newStatus: Status
): string[] {
  return [
    `${domain}_${oldStatus}`,
    `${domain}_${newStatus}`,
    `${domain}_count_${oldStatus}`,
    `${domain}_count_${newStatus}`,
  ];
}
```

## 受け入れ基準

- [ ] キャッシュ無効化マトリクスが`docs/architecture.md`に追加されている
- [ ] 単一操作とバッチ操作それぞれの無効化ルールが明記されている
- [ ] ステータス遷移パターンごとの無効化タグが明示されている
- [ ] 実装例コードが記載されている

## 優先度

低 - ドキュメント整備のため、機能には影響しない

## 関連ドキュメント

- `docs/cache.md`
- `packages/core/shared-kernel/cache/`
