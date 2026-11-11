# Backend APIの棚卸し

Issue #2812 のHTTP入口と共通化判断。契約の正本は [OpenAPI](openapi/backend-v1.json) と `packages/api-contracts`。DTOと入力制約の詳細は正本を参照する。

## 共通API

以下は `/api/v1` 配下の36操作。原則としてBearerまたはWeb session cookieを使い、共通middlewareで所有者・tenantを確立する。Cookieによる変更操作には信頼済みOriginが必要。`GET /session` はWeb session cookieのみを受け付ける。

JSON request bodyは4 MiB、upload chunkは `uploadChunkSize`（1 MiB）まで。JSON制限の対象は契約のrequest bodyから導出する。JSON成功応答は `jsonResponse` で契約検証・余分な項目の除去・status付き返却を行い、不正な出力は500として監視へ送る。204とmedia streamは専用処理とする。

| メソッド | パス | 用途 | 処理先 |
| --- | --- | --- | --- |
| GET | `/articles`, `/notes`, `/images`, `/books` | 状態別一覧（4操作） | `reads.page(domain)` |
| GET | `/articles/count`, `/notes/count`, `/images/count`, `/books/count` | 状態別件数（4操作） | `reads.count(domain)` |
| GET | `/articles/{id}`, `/notes/{id}`, `/images/{id}`, `/books/{id}` | 詳細（4操作） | `reads.detail(domain)` |
| DELETE | `/articles/{id}`, `/notes/{id}`, `/images/{id}`, `/books/{id}` | UNEXPORTEDのみ削除（4操作） | `writes.remove(domain)` |
| POST | `/articles` | 冪等な記事作成 | `writes.article` |
| POST | `/notes` | 冪等なノート作成 | `writes.note` |
| GET | `/books/isbn/{isbn}` | ISBN検索 | `reads.lookup(books)` |
| GET | `/notes/title/{title}` | タイトル検索 | `reads.lookup(notes)` |
| GET | `/categories` | カテゴリ一覧 | `reads.categories` |
| GET | `/sync/head` | 同期開始cursor | `reads.head` |
| GET | `/sync/snapshot` | 初回同期のページ取得 | `reads.snapshot` |
| GET | `/sync/changes` | 差分同期 | `reads.changes` |
| GET | `/search` | 横断検索 | `reads.search` |
| POST | `/uploads` | upload作成・再開 | `uploads.start` |
| GET | `/uploads/{id}` | upload状態 | `uploads.get` |
| DELETE | `/uploads/{id}` | upload取消 | `uploads.cancel` |
| PUT | `/uploads/{id}/chunks/{part}` | 分割binary送信 | `uploads.put` |
| POST | `/uploads/{id}/complete` | upload完了・コンテンツ作成 | `uploads.complete` |
| GET | `/media/{domain}/{id}/{variant}` | 原本・縮小画像stream | `reads.media` |
| GET | `/session` | Web session取得 | `context.session` |
| POST | `/push/subscriptions/status` | Push登録状態 | `push.status` |
| POST | `/push/subscriptions` | Push登録 | `push.subscribe` |
| DELETE | `/push/subscriptions` | Push解除 | `push.unsubscribe` |
| POST | `/push/test` | Pushテスト送信 | `push.test` |

## Host固有の入口

| メソッド | パス | 認証・用途 | 処理先 |
| --- | --- | --- | --- |
| GET | `/health` | 認証不要、DBへ接続しない死活確認 | HTTP host |
| GET | `/api/sign-in` | 信頼済み公開Originを確認しサインイン開始 | `deps.signIn` |
| GET / POST | `/api/auth/*` | 信頼済み公開Originを確認。各操作の認証はBetter Authが担当 | `deps.auth` |
| GET | `/api/cron/gigazine-headline` | `CRON_SECRET` Bearer、見出し配信 | `deps.cron` |

OAuth用Requestとsession取得用Headersは、呼び出し元で公開Originを選択・検証した後に `publicOriginHeaders` を利用する。転送制御ヘッダー4種を除去してHostを公開Originへ設定し、Cookie等のヘッダーを保持する。元のHeadersは変更しない。

## 共通化の判断

| 対象 | 判断と理由 |
| --- | --- |
| 4ドメインの一覧・件数・詳細・削除ルート | 既存の契約factoryと登録factoryを継続。所有者境界とドメイン別DTO型を保つ |
| JSON成功応答 | 検証と返却を共通helperへ集約。各handlerが契約のスキーマと200／201を明示する |
| JSON body制限 | 契約から対象を導出し、手書きのパス一覧との不一致を防ぐ |
| 公開Origin用Headers | 重複する変換のみ共通化。Originの選択・信頼性検証は各入口に残す |
| DTO変換・エラー定義 | 既存の共通変換・status別エラー契約を継続 |
| 作成・削除ユースケース | ドメイン固有の不変条件、イベント、ファイル処理があるため個別実装を維持 |
| 同期・upload・検索・Push | cursor、lease、冪等性、配信状態等の責務が異なるため汎用CRUDへ統合しない |
| 204・media stream・認証・Cron | JSON DTO返却とは異なる応答と認証を持つため専用処理を維持 |

公開パス・operationId・DTO・statusは変更せず、互換用の新しい層は追加しない。ドメインをまたぐ処理は既存Applicationサービスを利用し、coreドメイン間に直接依存を追加しない。
