# MinIO SDKの推移依存対策とAWS SDK v3への移行可否を検証する

## Metadata

| Field | Value |
| --- | --- |
| Category | Refactor / Storage |
| Priority | MEDIUM |
| Status | 比較検証待ち・移行未確定 |

## 問題

MinIO JS SDK 8.0.7はlatestでarchiveされていないが、decode-uri-componentとstream-jsonの監査検出がある。
実装調査ではquery-stringはstringify、stream-jsonはnotificationのJSONL Parserを使用。
対象decode/filterへの到達は未確認で、存在だけを理由に悪用可能と断定しない。
[調査報告・GHSA](../docs/dependency-audit.md)、[SDK公式](https://github.com/minio/minio-js)

## 比較範囲

- MinIO側の修正・親依存更新と、`@aws-sdk/client-s3`への交換を比較する。
  ストレージサービスは維持する。双方Apache-2.0、AWSアカウントの追加は不要。
- 既存操作: put/get/stat/remove、CLIのlistObjectsV2などClient直利用を全件確認。
  multipartやpresignは利用有無を確認して必要なモジュールだけ採用する。
- Cloudflare Accessヘッダーの付与、S3署名との整合、endpoint/path style、checksum、retry、
  Node stream、ページング、巨大ファイルのメモリ量を検証。
- 現在公開されているClient型・createMinioClient・S3Errorとアプリのinstanceof判定は変更対象。
  移行を採る場合はstorageの操作・エラーinterfaceに集約し、全呼び出し元を更新する。互換shimは不要。
- 依存数・server artifact容量・cold start・代表操作の時間を比較。
  直下の依存数だけで軽量と判定しない。
- [AWS S3移行資料](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrate-s3.html)を参照。
  メジャーを跨ぐ推移依存の強制overrideは互換性未確認のまま入れない。

## 完了条件・検証

- [ ] 上流修正で継続できるか、交換が必要かを根拠とともに決定し報告書へ記録。
- [ ] CRUD、欠損object、認証失敗、CF Access拒否、timeout、一覧の複数ページ、stream終了/失敗を比較。
- [ ] モックと専用の検証bucketで確認し、既存コンテンツを変更しない。
- [ ] コード変更した場合は`pnpm check:agent`、`pnpm build`とauditを実行。
- [ ] 実接続できなければ未検証事項として残し、移行を安全と断定しない。
- [ ] 調査が完了し、必要なら決定済みの実装issueへ引き継いで本issueを削除。
