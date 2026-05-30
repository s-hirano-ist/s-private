# CockroachDB 接続プール最適化と RU / コスト監視

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance / Ops |
| **Priority** | MEDIUM |
| **Status** | 未着手（CockroachDB Cloud Basic クラスタ作成・本番稼働後） |
| **Affected File** | [app/src/prisma.ts](../app/src/prisma.ts), [packages/database/src/index.ts](../packages/database/src/index.ts), CockroachDB Cloud 設定 |

## 概要

CockroachDB Cloud Basic は従量課金（無料枠 **$15/月 ≒ 50M Request Units + 10GiB ストレージ**、最大 30K RU/秒）。CockroachDB は内蔵プールで PostgreSQL より高い接続上限を持つが、Vercel serverless（per-invocation で接続が増える）との組み合わせで接続・RU を監視する。

## タスク

### 接続プール

- [ ] Prisma `adapter-pg` の `max`（現状 [app/src/prisma.ts](../app/src/prisma.ts) は 3、[packages/database/src/index.ts](../packages/database/src/index.ts) の scripts 用は 5）が Cloud Basic に対し適切か確認
- [ ] Vercel serverless の同時実行数 × 接続数を Cloud Console の接続数メトリクスで監視
- [ ] 逼迫時は Prisma Accelerate 経路（`index.ts` の `isAccelerate` 分岐）導入を検討

### RU / コスト監視

- [ ] Cloud Console で RU / storage 消費を確認し、無料枠（50M RU / 10GiB）超過の見込みを把握
- [ ] **予算アラート / spend limit を設定**（従量課金の暴走防止）
- [ ] 高 RU クエリを Console の SQL Activity で特定し、必要ならインデックス追加・クエリ改善

## 関連

- 参考: [Understand CockroachDB Cloud Costs](https://www.cockroachlabs.com/docs/cockroachcloud/costs) / [Plan a CockroachDB Basic Cluster](https://www.cockroachlabs.com/docs/cockroachcloud/plan-your-cluster-basic)
