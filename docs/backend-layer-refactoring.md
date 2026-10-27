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
共有packageは内部workspaceとして分離し、CLIからprivate backendへの依存を作らない。npm公開対象は外部利用のあるUIとCLIに限定する。

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

## CLI の状態遷移と保存方針

- reset は同一transactionで LAST_UPDATED → EXPORTED を確定し、UNEXPORTED → LAST_UPDATED を選択する。revert は LAST_UPDATED → UNEXPORTED のみを戻す。
- ingest は新規レコードを EXPORTED として登録し、既存レコードの状態・ID・作成日時を保持して本文を更新する。画像はpathを識別子として既存objectを上書きしない。
- 入力の走査を完了した場合のみ、入力に存在しない所有者本人の EXPORTED を削除する。入力の読み取り・検証・保存に失敗した場合は削除段階へ進まない。
- dry-run は差分と予定件数を返し、DB・objectの変更を行わない。表紙が入力にない書籍は既存のimagePathを保持する。
- 確定済みのバッチ操作は通知の配送失敗では失敗に戻さない。CLIは通知失敗を標準エラーへ記録する。
- CLIのbin名・配布packageは維持し、内部workspaceの必要コードをCLI成果物へ同梱する。内部packageの個別公開は行わない。

## DB確定とcommit後イベント

HTTPの作成処理はApplicationの`MutationCommit`を通して、コンテンツ保存とoperation成功を同一transactionで確定する。同期changeは既存DB triggerにより同じtransactionに含まれる。画像decode・object保存はcommitの前、イベント配送はcommitの後に実行する。

Infrastructureのtransaction adapterはcompositionごとのAsyncLocalStorageでrepositoryのDB clientをtransaction clientへ切り替える。並行リクエスト・再試行のscopeを分離し、再試行callbackにはDB操作だけを置く。HTTPのevent dispatcherは配送失敗を監視へ報告し、監視側の失敗も確定結果へ伝播させない。

## operation leaseとuploadの並行制御

operationは所有者・domain・入力hashを照合してから、token付き10分leaseをserializable transactionで取得する。1分ごとの更新に失敗したworkerは確定せず、成功・失敗の更新にも有効期限とtokenを条件として付ける。期限切れから新しいworkerが再開でき、古いworkerは新しい結果を上書きできない。

uploadのpartはuploadIdとpartの複合主キーで一意に記録し、同じサイズ・SHA-256の再送だけを許可する。chunkは試行ごとの不変keyへ保存し、保存前に候補keyと書き込みleaseをDBへ記録する。part採用と完了・取消は同じupload行を更新するtransactionで直列化する。完了処理はleaseを更新し、コンテンツ確定transaction内でもuploadのtokenを検証する。

完了結果は24時間のupload期限まで保持する。取消・完了・期限切れ後のchunk削除に失敗した場合は候補keyを保持し、後続upload開始時のcleanupで再試行する。進行中のchunk書き込みはlease期限までcleanup対象から外す。DBとobject storageの分散transactionは行わず、期限切れworker由来の孤立objectまで原子的に回収する保証は提供しない。

migrationの差分生成には`SHADOW_DATABASE_URL`で専用のshadow DBを指定できる。既存の未完了recordはprotocol 1、新規recordはprotocol 2として識別し、旧uploadを再開しない。

## 最終移行とリリース順

第9段の成功原子化、第10段のlease・part記録、第11段の互換撤去を、この順で取り込む。最終migration `9_expire_legacy_mobile_protocol` は旧chunkの保存先をcleanup候補へ移してからpart配列を削除し、protocol 1の未完了operationとuploadだけを失効させる。既存のコンテンツ、成功済みoperation、同期version・changeは変更しない。旧未完了operationの再送は409、旧uploadの再開は410となり、新しいoperation IDでやり直す。

本番のmigration適用・デプロイは担当者が実施する。Previewはmigration未適用のため、新schemaを必要とする操作はmigration済みローカルDBで確認する。MinIO停止は維持し、画像とuploadの実storage検証は専用ローカルbucketを注入したテスト環境で実施する。

差分生成のshadow DBは専用の使い捨てDBを使用する。再利用時、Prismaのresetで同期trigger関数が残るとmigration 6の関数作成が失敗するため、検証用shadow DBを空にしてから再生成する。
