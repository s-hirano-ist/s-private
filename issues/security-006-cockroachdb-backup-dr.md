# CockroachDB バックアップ / 災害復旧の確認

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | MEDIUM |
| **Status** | 未着手（CockroachDB Cloud Basic クラスタ作成後） |
| **Affected File** | `docs/cockroachdb-setup-runbook.md`, CockroachDB Cloud 設定 |

## 概要

CockroachDB Cloud Basic は **24時間間隔・30日保持** の管理バックアップ（スケジュール変更不可）を提供する。リストアは Cloud Console から実行できる。リストア手順を把握し、データ保護を確実にする。

## タスク

- [ ] Cloud Console で管理バックアップ（24h 間隔 / 30日保持）が有効なことを確認
- [ ] **リストアのドライラン**: 別クラスタ or 別 DB へ復元してみて手順・所要時間を把握
- [ ] 30日超の長期保管が必要なデータがあるか検討（必要なら `BACKUP` で外部ストレージへ self-managed backup を別途運用）
- [ ] 復旧手順（どの画面から何分で戻せるか）を docs に記載

## 関連

- [security-007-db-password-rotation-runbook](security-007-db-password-rotation-runbook.md)
- 参考: [Managed Backups in CockroachDB Basic Clusters](https://www.cockroachlabs.com/docs/cockroachcloud/managed-backups-basic)
