# backend責務の整理

## 承認済みの到達構成

| 配置 | 責務 |
| --- | --- |
| core | エンティティ・値オブジェクト・不変条件・ドメインrepository契約 |
| application | ユースケース・内部入出力・Applicationエラー・技術に依存しないport |
| infrastructure | Prisma・storage・画像処理・検索・配信・監視adapter |
| backend | HTTP・認証protocol・環境設定・DI・Cron入口 |
| scripts | CLI・ファイル入出力・進捗表示・終了コード・CLI用DI |

Applicationはcoreと汎用ライブラリだけに依存する。InfrastructureはApplicationのportを実装する。
Webは生成clientだけを使い、共有Applicationも直接呼ばない。
共有packageは公開可能とし、CLIからprivate backendへの依存を作らない。

## 監査結果とstack

| PR | 課題 | 根拠・対応 |
| --- | --- | --- |
| 1 | 層の検査不足 | backend内部にApplication/Infrastructure境界がない。packageと依存規則を追加 |
| 2 | APIへの逆依存 | mobileのport・sync・operationがapi/read-models・ApiError・HTTP契約に依存 |
| 3 | QueryとHTTPの混在 | api/read-serviceがPrisma、検索照合、DTO、Responseを兼務 |
| 4 | DB固有例外の漏出 | write-service・push-serviceがPrismaのP2002を判定 |
| 5 | 画像処理の具体依存 | parserがSharpを直接呼び、use-case入力型もparserから推論 |
| 6 | 配信・coreの責務 | Push client生成と配信方針の混在。coreのstorage・system event・検索表示型を整理 |
| 7 | 状態復元の誤り | Query repositoryがLAST_UPDATEDをUNEXPORTEDとして返す |
| 8 | CLI独自のmutation | reset/revert/ingestが独自のDB更新経路を持つ。共有Applicationへ統一 |
| 9 | 成功判定の境界 | DB保存とoperation成功記録が別操作。commit後イベント失敗で結果が変わり得る |
| 10 | 並行実行の競合 | operation取得・状態更新、upload part配列の読み書きに原子的な保証がない |
| 11 | 最終検証 | 互換分岐を撤去し、全経路・公開物・境界を検証 |

関連Issue: #2858（全体）、#2812（API）、#2768（Query）、#2809（通知）、#2681（イベント）。
個別課題: #2944（境界）、#2945（逆依存）、#2946（DB例外）、#2947（画像処理）、#2948（core責務）、#2949（状態復元）、#2950（CLI）、#2951（並行制御）。
各PRは直前のブランチをbaseにし、検証後に非Draft PRを作成する。Issueは自動クローズしない。

## 挙動の決定

- コンテンツとoperation成功を同一DB transactionで確定する。commit後の通知失敗は監視へ記録し、成功応答を変えない。
- operationの所有者・入力hashを確認し、token付き10分leaseを原子的に取得する。長い処理は1分ごとに更新する。
- upload partはuploadIdとpartで一意とし、同じ内容の再送だけを許容する。完了と取消は排他する。
- 完了結果はupload期限まで保持し、cleanup失敗は確定済み結果を失敗へ戻さない。
- 旧API・hash・metadataへの後方互換は提供しない。旧未完了状態は識別して失効扱いとする。
- 既存コンテンツ・成功結果・同期cursorは削除しない。MinIO停止中のobject移行・削除・再接続は行わない。
- DBとobject storageの分散transaction、Outbox、通知再配送workerは追加しない。

## 検証

各PRでpnpm check:agentを実行する。package構成変更にはbuildと公開物確認を追加する。
DB変更はローカルmigration適用後、同時実行・lease・rollback・part追加・完了/取消競合を実DBで検証する。
HTTP契約・所有者分離・状態別一覧・検索順位・CLI dry-runを回帰確認する。
MinIO停止中のuploadはadapterと統合テスト環境で検証し、実サービスでの未確認事項はPRへ記載する。
