# 依存パッケージ棚卸し・移行判断

## 結論

**保守終了が明示された `tsup` の移行と、既知の脆弱性を含む推移依存の更新を優先する。**
次に、単一APIのために導入しているGoogle Books SDKを標準`fetch`へ置き換える。
構文ハイライトとストレージSDKは比較検証を経て判断する。
認証、ORM、i18n、UI基盤の全面交換を勧める根拠は今回の調査では得られなかった。

| 優先度 | 判断 | 対応 |
| --- | --- | --- |
| P1 | 更新 | [既知の脆弱性19件を導入元ごとに解消・評価](../issues/security-001-transitive-dependencies.md) |
| P1 | 移行推奨 | [tsupからtsdownへ](../issues/refactor-007-tsup-to-tsdown.md) |
| P2 | 移行推奨 | [Google Books SDKをfetchへ](../issues/refactor-008-google-books-fetch.md) |
| P2 | 追加検証 | [MinIO SDKの推移依存対策とAWS SDK比較](../issues/refactor-009-storage-sdk-evaluation.md) |
| P2 | 更新 | [Next.js等のパッチ更新](../issues/chore-001-dependency-patch-updates.md) |
| P2 | 追加検証 | [Storybook・TypeScript・Vitest・Viteの互換性整理](../issues/chore-002-toolchain-compatibility.md) |
| P3 | 追加検証 | [構文ハイライトの言語限定とShiki比較](../issues/perf-010-syntax-highlighter.md) |

## 調査対象と証拠の扱い

- 確認日: **2026-09-12 JST**。公開日はnpm/GitHubのUTC日付。
- 対象コミット: `9d1a06c3`。開始時の作業ツリーはclean。
- 10 workspace、直接依存宣言142件（peer、workspace内依存を含む）、名前の重複を除く外部パッケージ97種を確認。
- 現在はNext.js **16.3.4**、React **19.2.8**、TypeScript **6.0.3**、Node.js **24.19.0**、pnpm **12.3.4**。
  計画時のNext.js 16.3.3から更新されているため、実際のmanifest/lockfileを基準にした。
- 全直接依存の宣言とlockfile解決を照合し、外部97種と代替・推移依存18種のnpmメタデータを取得。
  主要・比較対象28リポジトリのアーカイブ状態を確認し、重点候補の公式リリースと移行資料を読んだ。
- `pnpm audit --json`、`pnpm knip`、`pnpm -r why`、`pnpm peers check --lockfile-only --json`と実コードを照合。
  **auditの件数は検出アドバイザリ数であり、このアプリで悪用できる脆弱性の件数ではない。**
- 「維持」は現行要件で乗り換え根拠がないという判断。「安全の保証」「保守の将来保証」ではない。
  「更新」は同一ライブラリまたはその推移依存の修正。「追加検証」は移行確定ではない。
- 今回はドキュメントとissueのみを追加。ライブラリ、外部サービス、認証設定、DBスキーマは変更しない。

### 宣言と実装の整合性

計画時に見つかったMarkdownの不整合は現コミットでは解消済み。
`app/package.json`は`markdown-to-jsx@9.10.2`を直接宣言し、`react-markdown`と`remark-gfm`は直接依存から削除済み。
`markdown-viewer.tsx`のimportと一致しており、重複する移行issueは作成しない。

Knipは未使用・未宣言依存を報告せず、設定hintが3件だけだった。
`@types/react-syntax-highlighter`とUIの`postcss`のignore見直し、およびUIの`.css`探索範囲に関するhintで、
パッケージ削除の証拠ではない。削除確定の依存は0件。

ESLintはYAML/JSONで必要であり、JS向けプラグインも`.oxlintrc.json`の`jsPlugins`から利用している。
`@prisma/client-runtime-utils`は生成済みruntimeがrequireする。
`@vitest/coverage-v8`はcoverage設定、`lint-staged`はGit hook、`husky`はprepare、
型パッケージはTypeScriptの型解決から利用されるため、ソースのimport数だけで削除しない。
ルートとappのNext.js/i18n/Tailwind重複はStorybookやルートツールの解決も考慮し、
同じ解決版の重複宣言をそのまま二重ダウンロード・二重bundleとみなさない。

## セキュリティ監査

`pnpm audit --json`は終了コード1、**High 11 / Moderate 7 / Low 1 / Critical 0**。
メタデータはtotalDependencies 1542（dependencies 622、devDependencies 756、optionalDependencies 342）。
区分は重複するため単純加算しない。アドバイザリはすべて推移依存に対する検出だった。

以下の修正版は今回のアドバイザリを満たす下限であり、現時点の最新安全版や親パッケージとの互換性を保証しない。
更新時は再監査し、特にメジャー差を伴うoverrideを一括適用しない。

| 対象 | 検出版 | 重要度 | 修正下限 | 公式アドバイザリ |
| --- | --- | --- | --- | --- |
| `qs` | 6.15.1 | moderate | >=6.15.2 | [GHSA-q8mj-m7cp-5q26](https://github.com/advisories/GHSA-q8mj-m7cp-5q26) |
| `esbuild` | 0.27.7 | low | >=0.28.1 | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) |
| `fast-uri` | 3.1.3 | high | >=3.1.4 | [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) |
| `fast-uri` | 3.1.3 | high | >=3.1.5 | [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) |
| `deepmerge-ts` | 7.1.5 | high | >=8.0.0 | [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) |
| `decode-uri-component` | 0.2.2 | moderate | >=0.5.0 | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) |
| `browserslist` | 4.28.4 | high | >=4.28.7 | [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) |
| `browserslist` | 4.28.4 | high | >=4.28.7 | [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g) |
| `mysql2` | 3.15.3 | high | >=3.22.0 | [GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr) |
| `qs` | 6.15.1, 6.15.3 | moderate | >=6.16.0 | [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) |
| `qs` | 6.15.1, 6.15.3 | moderate | >=6.16.0 | [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) |
| `fast-uri` | 3.1.3 | high | >=3.1.6 | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) |
| `fast-uri` | 3.1.3 | high | >=3.1.6 | [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) |
| `fast-uri` | 3.1.3 | high | >=3.1.6 | [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) |
| `fast-uri` | 3.1.3 | high | >=3.1.6 | [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) |
| `mysql2` | 3.15.3 | moderate | >=3.23.1 | [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3) |
| `stream-json` | 1.9.1 | moderate | >=3.5.0 | [GHSA-528h-pc64-c93x](https://github.com/advisories/GHSA-528h-pc64-c93x) |
| `baseline-browser-mapping` | 2.10.41 | moderate | >=2.11.0 | [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) |
| `js-yaml` | 4.3.1 | high | >=4.3.2 | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) |

### 到達可能性と導入元への対応

| パッケージ | 導入経路・利用状況 | 対応判断 |
| --- | --- | --- |
| `fast-uri` | Prisma CLI → `@prisma/dev` → `@prisma/streams-local` → ajv。Sentry → webpack → schema-utils → ajv、Stylelint/Stryker → ajvもある | 各経路の解決版を修正。アプリがこのURI処理を信頼境界に使う証拠は未確認。SSRF成立を断定しない |
| `deepmerge-ts` | Prisma CLI → `@prisma/config` | 設定マージ経路。8系への変更は互換性確認が必要。DBリクエストに直接到達するとは判断しない |
| `mysql2` | Prisma CLIの固定依存`3.15.3`。Better Authのpeer経路にも現れる | 実DBはCockroachDB + `@prisma/adapter-pg`。MySQL接続を使用するコードは確認されず、現行DB認証が脆弱とは判断しない。CLI依存の修正を追跡 |
| `browserslist` / `baseline-browser-mapping` | Next.js、Babel、Storybook、Strykerなど。peer経由でAnalytics等も導入元に現れる | 主にビルド・ブラウザ対象解決。lockfile更新を優先し、信頼できないquery/statsを本番入力として受けるかを区別 |
| `qs` | Stryker → typed-rest-client（6.15.1）とBooks SDK → googleapis-common（6.15.3） | 双方の経路を対応。Books削除だけではStryker由来は残る |
| `decode-uri-component` | MinIO → query-string | 調査したMinIO実装では`query-string.stringify`を使っている。脆弱なdecode関数へのアプリ入力の到達は未確認。単なる依存の存在と区別 |
| `stream-json` | MinIO → stream-json。MinIOはnotificationで`jsonl/Parser.js`をimport | アドバイザリ対象はpick/ignore/filter/replace。現在のアプリはnotification購読を使わず、脆弱なfilterの使用も確認されない。更新負債として管理 |
| `esbuild` | UI → tsup → esbuild / bundle-require → esbuild | 対象はWindowsの開発サーバー。現環境はmacOS、tsupはbuild用途なのでその条件では再現していない。移行または解決版修正 |
| `js-yaml@4.3.1` | Stylelint → cosmiconfig | 設定ファイルの処理。アプリのfrontmatterが直接使う`js-yaml@5.4.1`とは別物。4系の経路を4.3.2以上に修正 |

`dev: false`の検出にもCLIやビルド用パッケージが含まれる。
Prisma CLIは`packages/database`のdependenciesにあり、公開パッケージのgenerate/build運用にも関わるので、
devDependenciesへの移動だけで解決した扱いにしない。
本番成果物への同梱と脆弱な関数の呼び出しは別途traceが必要。

## 非推奨・保守状況

直接依存の宣言版にnpmの`deprecated`指定はなかった。lockfileには以下の3種がある。

| 依存 | 導入経路 | 公式指定と方針 |
| --- | --- | --- |
| `node-domexception@1.0.0` | Books → googleapis-common → gaxios → node-fetch → fetch-blob | native DOMExceptionを利用するよう案内。Booksのfetch化で当該経路を除去。単体だけ削除しない。[npm](https://registry.npmjs.org/node-domexception/1.0.0) |
| `tsconfck@3.1.6` | Storybook Next.js Vite → vite-plugin-storybook-nextjs → vite-tsconfig-paths@5.1.4 | `unmaintained`。optional peerはTypeScript `^5.0.0`で、現行6.0.3と不一致。親の対応版または公式に対応する経路を検証。[npm](https://registry.npmjs.org/tsconfck/3.1.6) |
| `whatwg-encoding@3.1.1` | Cheerio → encoding-sniffer@0.2.1 | `@exodus/bytes`への移行案内。Cheerio側の対応を優先。今回の利用は`cheerio.load(html)`なので、文字列入口の実利用とbyte decodingを分ける。[npm](https://registry.npmjs.org/whatwg-encoding/3.1.1) |

`tsup`はnpmのdeprecated指定がなくても、READMEで積極的な保守終了とtsdownへの移行を案内している。
GitHubのarchivedフラグや最近のpushだけで「保守中」と分類しない。[tsup公式](https://github.com/egoist/tsup)

MinIO JS SDK、react-syntax-highlighter、next-themes、Husky、Turndownは確認時点でarchiveされていない。
古い公開日だけを理由に「非推奨」「放置」とは判定しない。
MinIOサーバーの配布・保守方針を、別リポジトリのJS SDKの状態と混同しない。
外部サービスそのものの移行は今回の対象外。

## 乗り換え候補の比較

### tsup → tsdown: 移行推奨

現在のUIはESM・複数entry・code splitting・外部React依存・sourcemapを使い、
型宣言はtsupではなく後続の`tsc -p tsconfig.build.json`で生成する。
tsdown 0.23.0は公式の移行先で、React向けdirective対応も案内されている。
まず型生成を現行のtscに残してJSビルドだけ交換し、型生成の統合を別の最適化とする。
tsdownのdts/clean/外部依存の既定値をそのまま採用せず、現行の出力契約に合わせる。
[移行ガイド](https://tsdown.dev/guide/migrate-from-tsup)、[React対応](https://tsdown.dev/recipes/react-support)

期待効果は保守終了ツールへの依存解消。高速化は未計測。
現行tsupは直下17依存、tsdownは14依存だが、Rolldown/native関連を含む全体の軽さはこの数から判断できない。
tsdownのNode要件は`^22.18.0 || ^24.11.0 || >=26.0.0`で、
現在の24.19.0は満たすものの、repoが宣言する`>=24`の下限24.0では満たさない。
開発・CIの最小Node要件を明示する。ライセンスは双方MIT、追加SaaS不要。工数: 中。

### Google Books SDK → fetch: 移行推奨

`packages/scripts/src/enrich-books.ts`はAPIキーによる`volumes.list({ q: isbn })`だけを使用する。
OAuth更新や多数のAPI操作を提供するSDKの範囲に比べ用途が狭い。
現行9.0.0からSDK 12.0.0への更新も候補だが、
標準fetchで[Volumes検索API](https://developers.google.com/books/docs/v1/reference/volumes/list)を呼ぶ案を第一候補とする。

期待効果はGoogle認証・HTTPクライアントの依存経路削減。HTTP往復時間の短縮は保証しない。
URLSearchParams、タイムアウト、429/5xxへの上限付き再試行、使用するresponseフィールドの型検証を自前管理する負担が増える。
既存の600ms間隔、見つからないときのタイトル保持、本文保持、dry-run、項目ごとのエラー継続を検証する。
SDKはApache-2.0。標準API利用で新しいライブラリライセンスは増えず、APIキー・利用枠・サービス条件は従来どおり。
工数: 小〜中。

### react-syntax-highlighter → 言語限定 / Shiki: 追加検証

現在は`Prism`とstylesのまとめimportを使うasync Server Component。
`PrismLight`による言語登録・テーマ単独importを低変更量の比較対象とし、
Shiki 4.4.3のcore + 必要言語/テーマ + JavaScript engineによるサーバー処理も測定する。
Shikiはinstance生成が高コストであり、再利用が推奨される。
無制限にユーザー入力ごとの結果を保存するcacheは作らない。[Shiki性能指針](https://shiki.style/guide/best-performance)

比較軸はcold/warm処理時間、メモリ、サーバー成果物、実際のクライアントchunk。
現在もサーバー側で使っているため「ShikiならクライアントJSがゼロになる」という前提は置かない。
言語の削減は表示機能の削減にもなるため、保存済みコードフェンスとaliasの対応を確認する。
未知言語・言語なし・C++などの名称、HTML風のコード、長文、テーマ、アクセシビリティを検証する。
双方MIT。Shikiのlanguage/theme資産の通知も確認する。工数: 中。実測前は交換を確定しない。

### MinIO SDK → AWS SDK v3: 追加検証

現行8.0.7がnpm latestで、SDK自体はarchiveされていない。
8.0.7のリリースにはretryや並列upload、依存更新などの変更がある。
ただし推移依存2種の監査検出は残る。[SDKリリース](https://github.com/minio/minio-js/releases/tag/8.0.7)

AWS SDK v3の比較単位は`@aws-sdk/client-s3@3.1131.0`を基本に、
必要な場合だけmultipart用`@aws-sdk/lib-storage`やpresignerを加える。
現行MinIOの直下13依存に対しclient-s3は11依存だが、Smithy等が展開されるため依存削減の証拠にはしない。
S3互換のendpoint、path style、region/署名、Cloudflare Accessヘッダー、
get/put/stat/delete/listのstream・ページング・checksum・retry・multipartを比較する。
[AWS S3移行上の注意](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/migrate-s3.html)

このrepoはMinIOのClient型、`createMinioClient`、`S3Error`を公開し、
アプリのerror-wrapperで`instanceof S3Error`を使うため、単なるimportの置換では済まない。
交換するならstorage層のエラーと操作interfaceへ集約し、呼び出し元を一括更新する。
後方互換shimは設けない。APIキーや既存サービスは維持する。
SDKは双方Apache-2.0、AWSサービス契約の追加は不要。工数: 中〜大。

### Markdown・その他の基盤: 維持

- **markdown-to-jsx**: 現行9.10.2は直下runtime依存0、React向け入口とraw HTML無効化を利用済み。
  GFM・見出し・外部リンク・raw HTMLの既存テストがある。`javascript:`/`data:`等の危険URLは既存テストで未網羅。
  高速というライブラリの主張をアプリの実測とみなさない。今回再度のparser移行は不要。
  [公式README](https://github.com/quantizor/markdown-to-jsx)
- **Better Auth + Auth0**: すでに`better-auth/minimal`とPrisma adapterを使用。
  Next.js 16向けのRoute Handler/RSC/Server Actions統合が提供されている。
  Auth.jsへ戻す、またはAuth0 SDKへ全面移行する利益は未確認。
  cookieを更新するServer ActionとRoute Handlerの違いは更新時にも検証する。
  [公式Next.js統合](https://better-auth.com/docs/integrations/next)
- **Prisma + adapter-pg**: CockroachDB、生成型、既存repositoryを維持。
  Drizzle等への移行はCockroach固有のSQL・transaction・migration・認証adapterまで検証範囲が広がる。
  今回はCLIの脆弱な依存への対策を先に行い、ORM交換は選ばない。
  [既存migration制約issue](../issues/refactor-006-cockroachdb-migrate-dev-limitation.md)と重複させない。
- **next-intl**: RSCのserver/client入口を既存構成で使える。別i18n基盤への交換は不要。
  4.14.4のcookie base path修正をパッチ更新候補にする。
  [RSC対応](https://next-intl.dev/docs/environments/server-client-components)、[リリース](https://github.com/amannn/next-intl/releases/tag/v4.14.4)
- **Base UI / Tailwind / next-themes / lightbox**: React 19の現行UI要件に利用。
  DOM操作・フォーカス・portal・hydration・キーボード操作を再実装して依存数だけ減らす案は選ばない。
- **uuid / Zod**: UUIDはv7が要件なので`crypto.randomUUID()`のv4へ交換しない。
  Zodはdomainと入力境界を共有しており、軽量schemaへの全面交換より現行のパッチ更新を優先。
- **Sharp / Qdrant / Pino / 通知**: 既存のNode画像処理・型付き検索・構造化ログを維持。
  通知パッケージに外部runtime依存はない。標準fetchにできることを理由に全SDKを自作しない。
- **lint・test・buildツール**: Oxfmt/Oxlintへすでに移行済み。
  ESLint/stylelint/dependency-cruiserは異なる検証を担当しているため一括削除しない。
  Husky/lint-stagedを別製品へ変える性能上の必要性は未計測。

### 依存削減の規模感

lockfileの各snapshotから`dependencies`辺を辿り、peer suffixを除いたname@versionで数えた。
開始パッケージ自身を含み、optionalDependencies辺は除外する。
「専有」はその直接依存を外した場合に他の全workspaceの本番・開発依存から到達しなくなる数。
代替パッケージの導入後の差分、実ダウンロード量、bundle容量ではない。

| 直接依存 | 到達name@version数 | 専有name@version数 |
| --- | --- | --- |
| @googleapis/books | 45 | 24 |
| minio | 31 | 24 |
| tsup | 45 | 22 |
| react-syntax-highlighter | 28 | 23 |

## Next.js 16.3との互換性・更新順序

現在のNext設定は`reactCompiler: true`、`turbopackRustReactCompiler: true`、typedRoutes、
PrismaのserverExternalPackages、Vercelとself-hosted standaloneの分岐を持つ。
`cacheComponents`は現在設定されていない。過去の計画にあったInstant Navigation設定を前提にしない。

| 更新候補 | 結論と互換性条件 |
| --- | --- |
| Next.js 16.3.4 → 16.3.5 | パッチ更新推奨。image cache、adapter付きstandaloneのserver trace、loading/templateのCSP nonce等の修正あり。Vercel向け分岐を自動撤去せず両方式を確認。[公式リリース](https://github.com/vercel/next.js/releases/tag/v16.3.5) |
| React / react-dom 19.2.8 → 19.3.0 | Nextのpeer範囲には入るが、新機能採用とは分離。型も合わせ、Compiler・hydration・Storybookを検証して採用。[公式リリース](https://github.com/facebook/react/releases/tag/v19.3.0) |
| TypeScript 6.0.3 → 7.0.2 | TypeDoc 0.28.20のpeerは6.0.xまで。高速化の候補だが、型生成・docs・Stryker checker・型対応lintの動作確認まで保留 |
| Vitest 4.1.11 → 5.0.0 | Storybook addon-vitest 10.6.0のpeerが3/4系。現時点では一括更新を推奨しない。browser/coverage/runnerを同一系列で扱う |
| Vite 7.3.6 → 8.3.0 | Storybook Next.js Vite 10.6.0とVitest 4.1.11のpeerは8系を許容。Rolldown移行の性能効果はUI consumer/Storybookで実測する。NextのTurbopack build高速化とは別 |
| Prisma 7.10.0 | npm latestは8.0.0-rc.13を返した。RCを自動採用しない。GitHub monorepoのlatest releaseも必ずしもORM版を意味しない。client/adapter/runtime-utils/CLIの系列を確認 |
| @types/node | npm latestは22.20.2を返したが、実行環境24に合わせて24系を維持。latestタグへの追従で下げない |
| next-intl / Zod / lucide-react / happy-dom | 4.14.4 / 4.6.2 / 1.45.0 / 20.14.5を小規模更新候補とする。安全性・性能が必ず改善するとは断定しない |

互換性表のバージョンとpeer範囲は後掲のnpm出典で確認。
現行のpeer検査では`tsconfck@3.1.6 → typescript ^5.0.0`に6.0.3が解決されるoptional peer不一致が1件あった。
それ以外のworkspaceのbad/missingは空。終了コードだけで「互換性問題なし」と判定しない。

## 全直接依存一覧

種別: 本=dependencies、開=devDependencies、peer=公開consumerへの要件。
解決版はlockfile importerのversion（長いpeer suffixは省略）。
peer行は同workspaceの開発時解決を記載し、consumerがその版に固定される意味ではない。
用途欄は代表箇所であり、全importの列挙ではない。
「維持」でも上記の推移依存対策は別途必要。workspace linkは外部npmの保守判定対象外。

### ルートworkspace

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `next` | 本 | 16.3.4 | 16.3.4 | Next.js・Storybook基盤 / `app/next.config.mjs` | 更新 |
| `next-intl` | 本 | 4.14.3 | 4.14.3 | 翻訳・RSC統合 / `app/src/infrastructures/i18n/request.ts` | 更新 |
| `@chromatic-com/storybook` | 開 | 5.3.1 | 5.3.1 | visual test統合 / `.storybook/main.ts` | 維持 |
| `@playwright/test` | 開 | 1.63.0 | 1.63.0 | E2E runner / `playwright.config.ts` | 維持 |
| `@s-hirano-ist/s-ui` | 開 | workspace:* | link:packages/ui | 内部ui / `app/src/app/[locale]/(authenticated)/articles/loading.tsx` | 維持 |
| `@secretlint/secretlint-rule-preset-recommend` | 開 | 13.0.5 | 13.0.5 | secretルール解決 / `scripts/check-secrets.mjs` | 維持 |
| `@storybook/addon-a11y` | 開 | 10.6.0 | 10.6.0 | Storybook統合 / `.storybook/main.ts` | 維持 |
| `@storybook/addon-docs` | 開 | 10.6.0 | 10.6.0 | Storybook統合 / `.storybook/main.ts` | 維持 |
| `@storybook/addon-mcp` | 開 | 10.6.0 | 10.6.0 | Storybook統合 / `.storybook/main.ts` | 維持 |
| `@storybook/addon-themes` | 開 | 10.6.0 | 10.6.0 | Storybook統合 / `.storybook/main.ts` | 維持 |
| `@storybook/addon-vitest` | 開 | 10.6.0 | 10.6.0 | Storybook統合 / `.storybook/main.ts` | 維持 |
| `@storybook/nextjs-vite` | 開 | 10.6.0 | 10.6.0 | Storybook統合 / `.storybook/main.ts` | 追加検証 |
| `@stryker-mutator/core` | 開 | 10.0.0 | 10.0.0 | mutation test runner / `package.json` | 更新（推移） |
| `@stryker-mutator/typescript-checker` | 開 | 10.0.0 | 10.0.0 | mutation型検査 / `stryker.config.json` | 維持 |
| `@stryker-mutator/vitest-runner` | 開 | 10.0.0 | 10.0.0 | mutation test統合 / `stryker.config.json` | 維持 |
| `@tailwindcss/postcss` | 開 | 4.3.3 | 4.3.3 | Tailwind PostCSS統合 / `.storybook/main.ts` | 維持 |
| `@tailwindcss/typography` | 開 | 0.5.20 | 0.5.20 | proseスタイル・formatter / `app/src/app/globals.css` | 維持 |
| `@testing-library/jest-dom` | 開 | 7.0.1 | 7.0.1 | DOM assertion / `app/vitest-setup.tsx` | 維持 |
| `@testing-library/react` | 開 | 16.3.3 | 16.3.3 | Reactテスト / `app/src/components/common/layouts/cards/base-card-stack.bench.tsx` | 維持 |
| `@vitest/browser` | 開 | 4.1.11 | 4.1.11 | browser test型・API / `app/vitest.shims.d.ts` | 追加検証 |
| `@vitest/browser-playwright` | 開 | 4.1.11 | 4.1.11 | browser provider / `vitest.config.ts` | 追加検証 |
| `@vitest/coverage-v8` | 開 | 4.1.11 | 4.1.11 | coverage provider / `vitest.config.ts` | 追加検証 |
| `dependency-cruiser` | 開 | 18.2.0 | 18.2.0 | 依存境界検査 / `dependency-cruiser.config.js` | 維持 |
| `eslint` | 開 | 10.10.0 | 10.10.0 | YAML/JSON lint / `eslint.config.js` | 維持 |
| `eslint-plugin-jsonc` | 開 | 3.4.2 | 3.4.2 | lintルール / `eslint.config.js` | 維持 |
| `eslint-plugin-perfectionist` | 開 | 5.11.0 | 5.11.0 | lintルール / `.oxlintrc.json` | 維持 |
| `eslint-plugin-react-hooks` | 開 | 7.1.1 | 7.1.1 | lintルール / `.oxlintrc.json` | 維持 |
| `eslint-plugin-regexp` | 開 | 3.3.0 | 3.3.0 | lintルール / `.oxlintrc.json` | 維持 |
| `eslint-plugin-sonarjs` | 開 | 4.2.0 | 4.2.0 | lintルール / `.oxlintrc.json` | 維持 |
| `eslint-plugin-storybook` | 開 | 10.6.0 | 10.6.0 | lintルール / `.oxlintrc.json` | 維持 |
| `eslint-plugin-unicorn` | 開 | 74.0.0 | 74.0.0 | lintルール / `.oxlintrc.json` | 維持 |
| `eslint-plugin-yml` | 開 | 3.8.1 | 3.8.1 | lintルール / `eslint.config.js` | 維持 |
| `happy-dom` | 開 | 20.14.3 | 20.14.3 | テストDOM / `app/vitest.config.ts` | 更新 |
| `husky` | 開 | 9.1.7 | 9.1.7 | Git hook設定 / `package.json` | 維持 |
| `jscpd` | 開 | 5.2.0 | 5.2.0 | 重複コード検査 / `.jscpd.json` | 維持 |
| `knip` | 開 | 6.35.1 | 6.35.1 | 未使用依存検査 / `knip.json` | 維持 |
| `lint-staged` | 開 | 17.5.1 | 17.5.1 | 変更ファイル検証 / `.husky/pre-commit` | 維持 |
| `oxfmt` | 開 | 0.67.0 | 0.67.0 | format・import整列 / `.oxfmtrc.json` | 維持 |
| `oxlint` | 開 | 1.82.0 | 1.82.0 | JS/TS lint / `.oxlintrc.json` | 維持 |
| `oxlint-plugin-eslint` | 開 | 1.82.0 | 1.82.0 | 補完JSルール / `.oxlintrc.json` | 維持 |
| `oxlint-tsgolint` | 開 | 7.0.2001 | 7.0.2001 | 型対応lint / `.oxlintrc.json` | 維持 |
| `playwright` | 開 | 1.63.0 | 1.63.0 | browser test・browser install / `vitest.config.ts` | 維持 |
| `storybook` | 開 | 10.6.0 | 10.6.0 | UI story runner / `.storybook/main.ts` | 維持 |
| `storybook-next-intl` | 開 | 10.1.3 | 10.1.3 | Storybook翻訳provider / `.storybook/main.ts` | 維持 |
| `stylelint` | 開 | 17.15.0 | 17.15.0 | CSS lint / `.stylelintrc.mjs` | 更新（推移） |
| `stylelint-config-standard` | 開 | 40.0.0 | 40.0.0 | CSSルール / `.stylelintrc.mjs` | 維持 |
| `stylelint-declaration-block-no-ignored-properties` | 開 | 3.0.0 | 3.0.0 | CSSルール / `.stylelintrc.mjs` | 維持 |
| `stylelint-no-unsupported-browser-features` | 開 | 8.1.2 | 8.1.2 | CSSルール / `.stylelintrc.mjs` | 維持 |
| `stylelint-order` | 開 | 8.1.1 | 8.1.1 | CSSルール / `.stylelintrc.mjs` | 維持 |
| `tailwindcss` | 開 | 4.3.3 | 4.3.3 | CSS生成 / `app/src/app/globals.css` | 維持 |
| `turbo` | 開 | 2.10.12 | 2.10.12 | タスク依存・cache / `turbo.json` | 維持 |
| `typedoc` | 開 | 0.28.20 | 0.28.20 | API docs生成 / `typedoc.json` | 維持 |
| `typedoc-plugin-mdn-links` | 開 | 5.1.1 | 5.1.1 | API docs外部リンク / `typedoc.json` | 維持 |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |
| `vitest` | 開 | 4.1.11 | 4.1.11 | unit/component/browser tests / `vitest.config.ts` | 追加検証 |

### app

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `@s-hirano-ist/s-core` | 本 | workspace:* | link:../packages/core | 内部core / `app/src/application-services/articles/add-article.core.ts` | 維持 |
| `@s-hirano-ist/s-database` | 本 | workspace:* | link:../packages/database | 内部database / `app/src/common/error/error-wrapper.test.ts` | 維持 |
| `@s-hirano-ist/s-image-processing` | 本 | workspace:* | link:../packages/image-processing | 内部image-processing / `app/src/infrastructures/images/services/sharp-image-processor.ts` | 維持 |
| `@s-hirano-ist/s-notification` | 本 | workspace:* | link:../packages/notification | 内部notification / `app/src/common/error/error-wrapper.test.ts` | 維持 |
| `@s-hirano-ist/s-search` | 本 | workspace:* | link:../packages/search | 内部search / `app/src/infrastructures/search/search-service.ts` | 維持 |
| `@s-hirano-ist/s-storage` | 本 | workspace:* | link:../packages/storage | 内部storage / `app/src/common/error/error-wrapper.test.ts` | 維持 |
| `@s-hirano-ist/s-ui` | 本 | workspace:* | link:../packages/ui | 内部ui / `app/src/app/[locale]/(authenticated)/articles/loading.tsx` | 維持 |
| `@sentry/nextjs` | 本 | 10.74.0 | 10.74.0 | エラー監視・build統合 / `app/instrumentation-client.ts` | 更新（推移） |
| `@t3-oss/env-nextjs` | 本 | 0.13.11 | 0.13.11 | 環境変数の型・検証 / `app/src/env.ts` | 維持 |
| `@tailwindcss/typography` | 本 | 0.5.20 | 0.5.20 | proseスタイル・formatter / `app/src/app/globals.css` | 維持 |
| `@vercel/analytics` | 本 | 2.0.1 | 2.0.1 | アクセス解析 / `app/src/app/[locale]/layout.tsx` | 維持 |
| `@vercel/speed-insights` | 本 | 2.0.0 | 2.0.0 | 性能計測 / `app/src/app/[locale]/layout.tsx` | 維持 |
| `better-auth` | 本 | 1.7.4 | 1.7.4 | Auth0連携・セッション / `app/src/infrastructures/auth/auth.ts` | 維持 |
| `lucide-react` | 本 | 1.44.0 | 1.44.0 | アイコン / `app/src/components/articles/client/article-form.tsx` | 更新 |
| `markdown-to-jsx` | 本 | 9.10.2 | 9.10.2 | Markdown描画 / `app/src/components/common/display/markdown-viewer.tsx` | 維持 |
| `next` | 本 | 16.3.4 | 16.3.4 | Next.js・Storybook基盤 / `app/next.config.mjs` | 更新 |
| `next-intl` | 本 | 4.14.3 | 4.14.3 | 翻訳・RSC統合 / `app/src/infrastructures/i18n/request.ts` | 更新 |
| `next-themes` | 本 | 0.4.6 | 0.4.6 | テーマ・hydration / `app/src/providers/theme-provider.tsx` | 維持 |
| `pino` | 本 | 10.3.1 | 10.3.1 | 構造化ログ / `app/src/infrastructures/observability/logging/server-logger.ts` | 維持 |
| `react` | 本 | 19.2.8 | 19.2.8 | React component・hooks / `app/src/app/[locale]/(authenticated)/articles/page.tsx` | 追加検証 |
| `react-dom` | 本 | 19.2.8 | 19.2.8 | DOM/SSR描画 / `app/src/components/common/display/markdown-viewer.test.tsx` | 追加検証 |
| `react-syntax-highlighter` | 本 | 16.1.1 | 16.1.1 | コード色分け / `app/src/components/common/display/markdown-viewer.tsx` | 追加検証 |
| `server-only` | 本 | 0.0.1 | 0.0.1 | サーバー境界のimport guard / `app/src/application-services/articles/add-article.core.ts` | 維持 |
| `yet-another-react-lightbox` | 本 | 3.32.2 | 3.32.2 | 画像閲覧 / `app/src/components/common/display/image/image-stack.tsx` | 維持 |
| `zod` | 本 | 4.6.1 | 4.6.1 | 入力・domain schema / `app/src/app/api/internal/cache/invalidate/route.ts` | 更新 |
| `@tailwindcss/postcss` | 開 | 4.3.3 | 4.3.3 | Tailwind PostCSS統合 / `app/postcss.config.js` | 維持 |
| `@types/node` | 開 | 24.13.3 | 24.13.3 | 型解決 / `app/tsconfig.json` | 維持 |
| `@types/react` | 開 | 19.2.18 | 19.2.18 | 型解決 / `app/tsconfig.json` | 追加検証 |
| `@types/react-dom` | 開 | 19.2.7 | 19.2.7 | 型解決 / `app/tsconfig.json` | 追加検証 |
| `@types/react-syntax-highlighter` | 開 | 15.5.13 | 15.5.13 | 型解決 / `app/tsconfig.json` | 維持 |
| `postcss` | 開 | 8.5.28 | 8.5.28 | CSS処理・設定 / `app/postcss.config.js` | 維持 |
| `tailwindcss` | 開 | 4.3.3 | 4.3.3 | CSS生成 / `app/src/app/globals.css` | 維持 |

### packages/core

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `uuid` | 本 | 14.0.2 | 14.0.2 | UUID v7生成 / `packages/core/shared-kernel/services/id-generator.ts` | 維持 |
| `zod` | 本 | 4.6.1 | 4.6.1 | 入力・domain schema / `packages/core/articles/entities/article-entity.test.ts` | 更新 |
| `@types/node` | 開 | 24.13.3 | 24.13.3 | 型解決 / `packages/core/tsconfig.json` | 維持 |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |

### packages/database

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `@prisma/adapter-pg` | 本 | 7.10.0 | 7.10.0 | CockroachDB用pg adapter / `packages/database/src/index.ts` | 維持 |
| `@prisma/client` | 本 | 7.10.0 | 7.10.0 | Prisma生成client/runtime / `packages/database/prisma/schema.prisma` | 維持 |
| `@prisma/client-runtime-utils` | 本 | 7.10.0 | 7.10.0 | 生成clientのruntime / `packages/database/src/generated/runtime/client.js` | 維持 |
| `prisma` | 本 | 7.10.0 | 7.10.0 | generate・migration・Studio / `packages/database/prisma.config.ts` | 更新（推移） |
| `@types/node` | 開 | 24.13.3 | 24.13.3 | 型解決 / `packages/database/tsconfig.json` | 維持 |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |

### packages/image-processing

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `sharp` | 本 | 0.35.4 | 0.35.4 | 画像変換 / `packages/image-processing/src/node.ts` | 維持 |
| `@types/node` | 開 | 24.13.3 | 24.13.3 | 型解決 / `packages/image-processing/tsconfig.json` | 維持 |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |

### packages/notification

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |

### packages/scripts

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `@googleapis/books` | 本 | 9.0.0 | 9.0.0 | ISBN検索 / `packages/scripts/src/enrich-books.ts` | 移行推奨 |
| `@s-hirano-ist/s-core` | 本 | workspace:* | link:../core | 内部core / `packages/scripts/src/fetch-articles.ts` | 維持 |
| `@s-hirano-ist/s-database` | 本 | workspace:* | link:../database | 内部database / `packages/scripts/src/fetch-articles.ts` | 維持 |
| `@s-hirano-ist/s-image-processing` | 本 | workspace:* | link:../image-processing | 内部image-processing / `packages/scripts/src/fix-image-formats.ts` | 維持 |
| `@s-hirano-ist/s-notification` | 本 | workspace:* | link:../notification | 内部notification / `packages/scripts/src/cleanup-minio-images.ts` | 維持 |
| `@s-hirano-ist/s-search` | 本 | workspace:* | link:../search | 内部search / `packages/scripts/src/enrich-books.ts` | 維持 |
| `@s-hirano-ist/s-storage` | 本 | workspace:* | link:../storage | 内部storage / `packages/scripts/src/cleanup-minio-images.ts` | 維持 |
| `cheerio` | 本 | 1.2.0 | 1.2.0 | HTML抽出 / `packages/scripts/src/update-json-articles.ts` | 維持 |
| `js-yaml` | 本 | 5.4.1 | 5.4.1 | frontmatter load/dump / `packages/scripts/src/enrich-books.ts` | 維持 |
| `oxfmt` | 本 | 0.67.0 | 0.67.0 | format・import整列 / `packages/scripts/src/s-content-format-runner.ts` | 維持 |
| `turndown` | 本 | 7.2.4 | 7.2.4 | HTML→Markdown / `packages/scripts/src/update-raw-articles.ts` | 維持 |
| `@types/node` | 開 | 24.13.3 | 24.13.3 | 型解決 / `packages/scripts/tsconfig.json` | 維持 |
| `@types/turndown` | 開 | 5.0.6 | 5.0.6 | 型解決 / `packages/scripts/tsconfig.json` | 維持 |
| `tsx` | 開 | 4.23.13 | 4.23.13 | TypeScript CLI実行 / `packages/scripts/package.json` | 維持 |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |

### packages/search

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `@qdrant/js-client-rest` | 本 | 1.19.0 | 1.19.0 | 型付きvector検索 / `packages/search/src/qdrant-client.ts` | 維持 |
| `js-yaml` | 本 | 5.4.1 | 5.4.1 | frontmatter load/dump / `packages/search/src/frontmatter.ts` | 維持 |
| `@types/node` | 開 | 24.13.3 | 24.13.3 | 型解決 / `packages/search/tsconfig.json` | 維持 |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |

### packages/storage

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `minio` | 本 | 8.0.7 | 8.0.7 | S3互換ストレージ / `packages/storage/src/storage-service.ts` | 追加検証 |
| `@types/node` | 開 | 24.13.3 | 24.13.3 | 型解決 / `packages/storage/tsconfig.json` | 維持 |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |

### packages/ui

| 依存 | 種 | 宣言 | 解決 | 用途・代表箇所 | 判定 |
| --- | --- | --- | --- | --- | --- |
| `@base-ui/react` | 本 | 1.8.0 | 1.8.0 | UI primitive・a11y / `packages/ui/src/dialog.tsx` | 維持 |
| `lucide-react` | 本 | 1.44.0 | 1.44.0 | アイコン / `packages/ui/src/combobox-field.tsx` | 更新 |
| `tailwind-merge` | 本 | 3.6.0 | 3.6.0 | Tailwind競合解決 / `packages/ui/src/utils/cn.ts` | 維持 |
| `tailwind-variants` | 本 | 3.3.1 | 3.3.1 | UI variant定義 / `packages/ui/src/button.tsx` | 維持 |
| `@arethetypeswrong/cli` | 開 | 0.18.5 | 0.18.5 | 公開型解決検証 / `packages/ui/package.json` | 維持 |
| `@storybook/react-vite` | 開 | 10.6.0 | 10.6.0 | Storybook統合 / `packages/ui/.storybook/main.ts` | 維持 |
| `@tailwindcss/cli` | 開 | 4.3.3 | 4.3.3 | UI CSS build / `packages/ui/package.json` | 維持 |
| `@tailwindcss/postcss` | 開 | 4.3.3 | 4.3.3 | Tailwind PostCSS統合 / `packages/ui/postcss.config.mjs` | 維持 |
| `@types/react` | 開 | 19.2.18 | 19.2.18 | 型解決 / `packages/ui/tsconfig.json` | 追加検証 |
| `@types/react-dom` | 開 | 19.2.7 | 19.2.7 | 型解決 / `packages/ui/tsconfig.json` | 追加検証 |
| `postcss` | 開 | 8.5.28 | 8.5.28 | CSS処理・設定 / `packages/ui/postcss.config.mjs` | 維持 |
| `publint` | 開 | 0.3.24 | 0.3.24 | 公開package検証 / `packages/ui/package.json` | 維持 |
| `react` | 開 | 19.2.8 | 19.2.8 | React component・hooks / `packages/ui/fixtures/vite/src/main.tsx` | 追加検証 |
| `react-dom` | 開 | 19.2.8 | 19.2.8 | DOM/SSR描画 / `packages/ui/fixtures/vite/src/main.tsx` | 追加検証 |
| `tsup` | 開 | 8.5.1 | 8.5.1 | UI ESM bundle / `packages/ui/tsup.config.ts` | 移行推奨 |
| `typescript` | 開 | 6.0.3 | 6.0.3 | 型検査・型生成 / `tsconfig.base.json` | 追加検証 |
| `vite` | 開 | 7.3.6 | 7.3.6 | UI consumer・Storybook build / `packages/ui/.storybook/main.ts` | 追加検証 |
| `react` | peer | ^19.2.8 | 19.2.8 | React component・hooks / `packages/ui/fixtures/vite/src/main.tsx` | 追加検証 |
| `react-dom` | peer | ^19.2.8 | 19.2.8 | DOM/SSR描画 / `packages/ui/fixtures/vite/src/main.tsx` | 追加検証 |

## npm公開情報の一覧

全外部直接依存の公開情報。リンク先は公式npmレジストリ。
latestは取得時のdist-tagであり、更新推奨版とは限らない。
ライセンスは宣言版のメタデータを記載し、推移依存全体のライセンス判定ではない。
特に`eslint-plugin-sonarjs`はLGPL-3.0-onlyで、開発ツールの利用と再配布時の条件を区別する。
新たな有償サービスの導入は本提案に含めず、既存SaaSの料金・上限は今回再監査していない。

| 依存・npm出典 | latestタグ | latest公開日 UTC | 宣言版license | 直下依存数 |
| --- | --- | --- | --- | --- |
| [@arethetypeswrong/cli](https://registry.npmjs.org/@arethetypeswrong%2fcli) | 0.18.5 | 2026-07-09 | MIT | 7 |
| [@base-ui/react](https://registry.npmjs.org/@base-ui%2freact) | 1.8.0 | 2026-09-04 | MIT | 5 |
| [@chromatic-com/storybook](https://registry.npmjs.org/@chromatic-com%2fstorybook) | 5.3.1 | 2026-09-02 | MIT | 4 |
| [@googleapis/books](https://registry.npmjs.org/@googleapis%2fbooks) | 12.0.0 | 2026-09-11 | Apache-2.0 | 1 |
| [@playwright/test](https://registry.npmjs.org/@playwright%2ftest) | 1.63.0 | 2026-09-04 | Apache-2.0 | 1 |
| [@prisma/adapter-pg](https://registry.npmjs.org/@prisma%2fadapter-pg) | 7.10.0 | 2026-08-25 | Apache-2.0 | 4 |
| [@prisma/client](https://registry.npmjs.org/@prisma%2fclient) | 7.10.0 | 2026-08-25 | Apache-2.0 | 1 |
| [@prisma/client-runtime-utils](https://registry.npmjs.org/@prisma%2fclient-runtime-utils) | 7.10.0 | 2026-08-25 | Apache-2.0 | 0 |
| [@qdrant/js-client-rest](https://registry.npmjs.org/@qdrant%2fjs-client-rest) | 1.19.0 | 2026-08-04 | Apache-2.0 | 2 |
| [@secretlint/secretlint-rule-preset-recommend](https://registry.npmjs.org/@secretlint%2fsecretlint-rule-preset-recommend) | 13.0.5 | 2026-08-27 | MIT | 0 |
| [@sentry/nextjs](https://registry.npmjs.org/@sentry%2fnextjs) | 10.74.0 | 2026-09-09 | MIT | 14 |
| [@storybook/addon-a11y](https://registry.npmjs.org/@storybook%2faddon-a11y) | 10.6.0 | 2026-09-02 | MIT | 2 |
| [@storybook/addon-docs](https://registry.npmjs.org/@storybook%2faddon-docs) | 10.6.0 | 2026-09-02 | MIT | 7 |
| [@storybook/addon-mcp](https://registry.npmjs.org/@storybook%2faddon-mcp) | 10.6.0 | 2026-09-02 | MIT | 4 |
| [@storybook/addon-themes](https://registry.npmjs.org/@storybook%2faddon-themes) | 10.6.0 | 2026-09-02 | MIT | 1 |
| [@storybook/addon-vitest](https://registry.npmjs.org/@storybook%2faddon-vitest) | 10.6.0 | 2026-09-02 | MIT | 2 |
| [@storybook/nextjs-vite](https://registry.npmjs.org/@storybook%2fnextjs-vite) | 10.6.0 | 2026-09-02 | MIT | 5 |
| [@storybook/react-vite](https://registry.npmjs.org/@storybook%2freact-vite) | 10.6.0 | 2026-09-02 | MIT | 9 |
| [@stryker-mutator/core](https://registry.npmjs.org/@stryker-mutator%2fcore) | 10.0.0 | 2026-08-14 | Apache-2.0 | 26 |
| [@stryker-mutator/typescript-checker](https://registry.npmjs.org/@stryker-mutator%2ftypescript-checker) | 10.0.0 | 2026-08-14 | Apache-2.0 | 3 |
| [@stryker-mutator/vitest-runner](https://registry.npmjs.org/@stryker-mutator%2fvitest-runner) | 10.0.0 | 2026-08-14 | Apache-2.0 | 4 |
| [@t3-oss/env-nextjs](https://registry.npmjs.org/@t3-oss%2fenv-nextjs) | 0.13.11 | 2026-03-22 | MIT | 1 |
| [@tailwindcss/cli](https://registry.npmjs.org/@tailwindcss%2fcli) | 4.3.3 | 2026-07-16 | MIT | 7 |
| [@tailwindcss/postcss](https://registry.npmjs.org/@tailwindcss%2fpostcss) | 4.3.3 | 2026-07-16 | MIT | 5 |
| [@tailwindcss/typography](https://registry.npmjs.org/@tailwindcss%2ftypography) | 0.5.20 | 2026-06-08 | MIT | 1 |
| [@testing-library/jest-dom](https://registry.npmjs.org/@testing-library%2fjest-dom) | 7.0.1 | 2026-08-09 | MIT | 6 |
| [@testing-library/react](https://registry.npmjs.org/@testing-library%2freact) | 16.3.3 | 2026-08-27 | MIT | 1 |
| [@types/node](https://registry.npmjs.org/@types%2fnode) | 22.20.2 | 2026-09-09 | MIT | 1 |
| [@types/react](https://registry.npmjs.org/@types%2freact) | 19.3.0 | 2026-09-09 | MIT | 1 |
| [@types/react-dom](https://registry.npmjs.org/@types%2freact-dom) | 19.3.0 | 2026-09-09 | MIT | 0 |
| [@types/react-syntax-highlighter](https://registry.npmjs.org/@types%2freact-syntax-highlighter) | 15.5.13 | 2024-05-03 | MIT | 1 |
| [@types/turndown](https://registry.npmjs.org/@types%2fturndown) | 5.0.6 | 2025-10-26 | MIT | 0 |
| [@vercel/analytics](https://registry.npmjs.org/@vercel%2fanalytics) | 2.0.1 | 2026-03-12 | MIT | 0 |
| [@vercel/speed-insights](https://registry.npmjs.org/@vercel%2fspeed-insights) | 2.0.0 | 2026-03-10 | Apache-2.0 | 0 |
| [@vitest/browser](https://registry.npmjs.org/@vitest%2fbrowser) | 5.0.0 | 2026-09-03 | MIT | 8 |
| [@vitest/browser-playwright](https://registry.npmjs.org/@vitest%2fbrowser-playwright) | 5.0.0 | 2026-09-03 | MIT | 3 |
| [@vitest/coverage-v8](https://registry.npmjs.org/@vitest%2fcoverage-v8) | 5.0.0 | 2026-09-03 | MIT | 10 |
| [better-auth](https://registry.npmjs.org/better-auth) | 1.7.4 | 2026-09-10 | MIT | 17 |
| [cheerio](https://registry.npmjs.org/cheerio) | 1.2.0 | 2026-01-23 | MIT | 11 |
| [dependency-cruiser](https://registry.npmjs.org/dependency-cruiser) | 18.2.0 | 2026-08-10 | MIT | 18 |
| [eslint](https://registry.npmjs.org/eslint) | 10.10.0 | 2026-09-04 | MIT | 30 |
| [eslint-plugin-jsonc](https://registry.npmjs.org/eslint-plugin-jsonc) | 3.4.2 | 2026-08-22 | MIT | 9 |
| [eslint-plugin-perfectionist](https://registry.npmjs.org/eslint-plugin-perfectionist) | 5.11.0 | 2026-08-31 | MIT | 2 |
| [eslint-plugin-react-hooks](https://registry.npmjs.org/eslint-plugin-react-hooks) | 7.1.1 | 2026-04-17 | MIT | 5 |
| [eslint-plugin-regexp](https://registry.npmjs.org/eslint-plugin-regexp) | 3.3.0 | 2026-09-04 | MIT | 7 |
| [eslint-plugin-sonarjs](https://registry.npmjs.org/eslint-plugin-sonarjs) | 4.2.0 | 2026-07-14 | LGPL-3.0-only | 13 |
| [eslint-plugin-storybook](https://registry.npmjs.org/eslint-plugin-storybook) | 10.6.0 | 2026-09-02 | MIT | 2 |
| [eslint-plugin-unicorn](https://registry.npmjs.org/eslint-plugin-unicorn) | 74.0.0 | 2026-08-28 | MIT | 20 |
| [eslint-plugin-yml](https://registry.npmjs.org/eslint-plugin-yml) | 3.8.1 | 2026-08-05 | MIT | 7 |
| [happy-dom](https://registry.npmjs.org/happy-dom) | 20.14.5 | 2026-09-12 | MIT | 7 |
| [husky](https://registry.npmjs.org/husky) | 9.1.7 | 2024-11-18 | MIT | 0 |
| [js-yaml](https://registry.npmjs.org/js-yaml) | 5.4.1 | 2026-08-26 | MIT | 1 |
| [jscpd](https://registry.npmjs.org/jscpd) | 5.2.0 | 2026-09-08 | MIT | 0 |
| [knip](https://registry.npmjs.org/knip) | 6.35.1 | 2026-09-09 | ISC | 13 |
| [lint-staged](https://registry.npmjs.org/lint-staged) | 17.5.1 | 2026-09-10 | MIT | 3 |
| [lucide-react](https://registry.npmjs.org/lucide-react) | 1.45.0 | 2026-09-11 | ISC | 0 |
| [markdown-to-jsx](https://registry.npmjs.org/markdown-to-jsx) | 9.10.2 | 2026-08-03 | MIT | 0 |
| [minio](https://registry.npmjs.org/minio) | 8.0.7 | 2026-02-27 | Apache-2.0 | 13 |
| [next](https://registry.npmjs.org/next) | 16.3.5 | 2026-09-11 | MIT | 6 |
| [next-intl](https://registry.npmjs.org/next-intl) | 4.14.4 | 2026-09-11 | MIT | 10 |
| [next-themes](https://registry.npmjs.org/next-themes) | 0.4.6 | 2025-03-11 | MIT | 0 |
| [oxfmt](https://registry.npmjs.org/oxfmt) | 0.67.0 | 2026-09-07 | MIT | 1 |
| [oxlint](https://registry.npmjs.org/oxlint) | 1.82.0 | 2026-09-07 | MIT | 0 |
| [oxlint-plugin-eslint](https://registry.npmjs.org/oxlint-plugin-eslint) | 1.82.0 | 2026-09-07 | MIT | 0 |
| [oxlint-tsgolint](https://registry.npmjs.org/oxlint-tsgolint) | 7.0.2001 | 2026-07-21 | MIT | 0 |
| [pino](https://registry.npmjs.org/pino) | 10.3.1 | 2026-02-09 | MIT | 11 |
| [playwright](https://registry.npmjs.org/playwright) | 1.63.0 | 2026-09-04 | Apache-2.0 | 1 |
| [postcss](https://registry.npmjs.org/postcss) | 8.5.28 | 2026-09-03 | MIT | 3 |
| [prisma](https://registry.npmjs.org/prisma) | 8.0.0-rc.13 | 2026-09-04 | Apache-2.0 | 6 |
| [publint](https://registry.npmjs.org/publint) | 0.3.24 | 2026-08-19 | MIT | 4 |
| [react](https://registry.npmjs.org/react) | 19.3.0 | 2026-09-09 | MIT | 0 |
| [react-dom](https://registry.npmjs.org/react-dom) | 19.3.0 | 2026-09-09 | MIT | 1 |
| [react-syntax-highlighter](https://registry.npmjs.org/react-syntax-highlighter) | 16.1.1 | 2026-02-26 | MIT | 6 |
| [server-only](https://registry.npmjs.org/server-only) | 0.0.1 | 2022-09-03 | MIT | 0 |
| [sharp](https://registry.npmjs.org/sharp) | 0.35.4 | 2026-08-26 | Apache-2.0 | 3 |
| [storybook](https://registry.npmjs.org/storybook) | 10.6.0 | 2026-09-02 | MIT | 17 |
| [storybook-next-intl](https://registry.npmjs.org/storybook-next-intl) | 10.1.3 | 2026-06-22 | MIT | 1 |
| [stylelint](https://registry.npmjs.org/stylelint) | 17.15.0 | 2026-09-04 | MIT | 35 |
| [stylelint-config-standard](https://registry.npmjs.org/stylelint-config-standard) | 40.0.0 | 2026-01-15 | MIT | 1 |
| [stylelint-declaration-block-no-ignored-properties](https://registry.npmjs.org/stylelint-declaration-block-no-ignored-properties) | 3.0.0 | 2026-01-25 | MIT | 0 |
| [stylelint-no-unsupported-browser-features](https://registry.npmjs.org/stylelint-no-unsupported-browser-features) | 8.1.2 | 2026-09-09 | MIT | 3 |
| [stylelint-order](https://registry.npmjs.org/stylelint-order) | 8.1.1 | 2026-03-15 | MIT | 2 |
| [tailwind-merge](https://registry.npmjs.org/tailwind-merge) | 3.6.0 | 2026-05-10 | MIT | 0 |
| [tailwind-variants](https://registry.npmjs.org/tailwind-variants) | 3.3.1 | 2026-08-03 | MIT | 0 |
| [tailwindcss](https://registry.npmjs.org/tailwindcss) | 4.3.3 | 2026-07-16 | MIT | 0 |
| [tsup](https://registry.npmjs.org/tsup) | 8.5.1 | 2025-11-12 | MIT | 17 |
| [tsx](https://registry.npmjs.org/tsx) | 4.23.13 | 2026-08-30 | MIT | 1 |
| [turbo](https://registry.npmjs.org/turbo) | 2.10.12 | 2026-08-25 | MIT | 0 |
| [turndown](https://registry.npmjs.org/turndown) | 7.2.4 | 2026-04-03 | MIT | 1 |
| [typedoc](https://registry.npmjs.org/typedoc) | 0.28.20 | 2026-07-05 | Apache-2.0 | 5 |
| [typedoc-plugin-mdn-links](https://registry.npmjs.org/typedoc-plugin-mdn-links) | 5.1.1 | 2026-01-25 | MIT | 0 |
| [typescript](https://registry.npmjs.org/typescript) | 7.0.2 | 2026-07-08 | Apache-2.0 | 0 |
| [uuid](https://registry.npmjs.org/uuid) | 14.0.2 | 2026-08-18 | MIT | 0 |
| [vite](https://registry.npmjs.org/vite) | 8.3.0 | 2026-09-10 | MIT | 6 |
| [vitest](https://registry.npmjs.org/vitest) | 5.0.0 | 2026-09-03 | MIT | 20 |
| [yet-another-react-lightbox](https://registry.npmjs.org/yet-another-react-lightbox) | 3.32.2 | 2026-07-30 | MIT | 0 |
| [zod](https://registry.npmjs.org/zod) | 4.6.2 | 2026-09-10 | MIT | 0 |

### 主要リポジトリの保守確認

以下は公式GitHub APIで確認。すべてarchived=falseだったが、pushにはbot・自動更新も含まれる。
したがって「最近pushされた」だけで実質的な保守を保証しない。
tsupのような明示的な保守方針を優先する。

| 公式repository | 最終push UTC | 確認したlatest release |
| --- | --- | --- |
| [egoist/tsup](https://github.com/egoist/tsup) | 2026-09-07 | [v8.5.1](https://github.com/egoist/tsup/releases/tag/v8.5.1) |
| [rolldown/tsdown](https://github.com/rolldown/tsdown) | 2026-09-11 | [v0.23.0](https://github.com/rolldown/tsdown/releases/tag/v0.23.0) |
| [minio/minio-js](https://github.com/minio/minio-js) | 2026-09-10 | [8.0.7](https://github.com/minio/minio-js/releases/tag/8.0.7) |
| [react-syntax-highlighter/react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) | 2026-02-26 | [v16.1.1](https://github.com/react-syntax-highlighter/react-syntax-highlighter/releases/tag/v16.1.1) |
| [pacocoursey/next-themes](https://github.com/pacocoursey/next-themes) | 2026-02-25 | npm公開日を参照 |
| [typicode/husky](https://github.com/typicode/husky) | 2026-03-19 | npm公開日を参照 |
| [mixmark-io/turndown](https://github.com/mixmark-io/turndown) | 2026-09-03 | npm公開日を参照 |
| [cheeriojs/cheerio](https://github.com/cheeriojs/cheerio) | 2026-09-11 | npm公開日を参照 |
| [quantizor/markdown-to-jsx](https://github.com/quantizor/markdown-to-jsx) | 2026-08-14 | npm公開日を参照 |
| [shikijs/shiki](https://github.com/shikijs/shiki) | 2026-09-11 | npm公開日を参照 |
| [googleapis/google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client) | 2026-09-11 | npm公開日を参照 |
| [aws/aws-sdk-js-v3](https://github.com/aws/aws-sdk-js-v3) | 2026-09-11 | npm公開日を参照 |
| [vercel/next.js](https://github.com/vercel/next.js) | 2026-09-12 | [v16.3.5](https://github.com/vercel/next.js/releases/tag/v16.3.5) |
| [facebook/react](https://github.com/facebook/react) | 2026-09-11 | [v19.3.0](https://github.com/react/react/releases/tag/v19.3.0) |
| [better-auth/better-auth](https://github.com/better-auth/better-auth) | 2026-09-12 | [v1.7.4](https://github.com/better-auth/better-auth/releases/tag/v1.7.4) |
| [prisma/prisma](https://github.com/prisma/prisma) | 2026-09-11 | [v0.17.0](https://github.com/prisma/orm/releases/tag/v0.17.0) |
| [amannn/next-intl](https://github.com/amannn/next-intl) | 2026-09-11 | [v4.14.4](https://github.com/amannn/next-intl/releases/tag/v4.14.4) |
| [getsentry/sentry-javascript](https://github.com/getsentry/sentry-javascript) | 2026-09-12 | npm公開日を参照 |
| [mui/base-ui](https://github.com/mui/base-ui) | 2026-09-11 | npm公開日を参照 |
| [qdrant/qdrant-js](https://github.com/qdrant/qdrant-js) | 2026-09-10 | npm公開日を参照 |
| [lovell/sharp](https://github.com/lovell/sharp) | 2026-09-07 | npm公開日を参照 |
| [pinojs/pino](https://github.com/pinojs/pino) | 2026-09-05 | npm公開日を参照 |
| [uuidjs/uuid](https://github.com/uuidjs/uuid) | 2026-09-10 | npm公開日を参照 |
| [colinhacks/zod](https://github.com/colinhacks/zod) | 2026-09-11 | npm公開日を参照 |
| [storybookjs/storybook](https://github.com/storybookjs/storybook) | 2026-09-11 | npm公開日を参照 |
| [vitest-dev/vitest](https://github.com/vitest-dev/vitest) | 2026-09-11 | [v5.0.0](https://github.com/vitest-dev/vitest/releases/tag/v5.0.0) |
| [microsoft/TypeScript](https://github.com/microsoft/TypeScript) | 2026-09-12 | [v7.0.2](https://github.com/microsoft/TypeScript/releases/tag/v7.0.2) |
| [vitejs/vite](https://github.com/vitejs/vite) | 2026-09-10 | [create-vite@9.2.1](https://github.com/vitejs/vite/releases/tag/create-vite%409.2.1) |

## 検証結果と残る確認

- manifestとlockfileの全直接依存宣言を照合: 不一致0件。
- `pnpm install --frozen-lockfile --ignore-scripts`: 成功。pnpm 12の自動同期がネットワーク制限で中断したため復元に使用。
  依存宣言・lockfileの変更なし。最終audit/why/Knipは復元後に再実行した。
- `pnpm audit --json`: 検出19件による終了コード1。検出の全10パッケージの導入元を`pnpm -r why`で確認。
- `pnpm knip`: 成功。未使用・未宣言の報告なし、設定hint3件。
- `pnpm peers check --lockfile-only --json`: 終了コード0だが、前述のoptional peer不一致1件あり。
- 追加した8 Markdownファイルのローカルリンクと、142宣言・全19 GHSAの掲載を検証。
  Oxfmtはrepo設定でMarkdownを対象外にしているため、Markdownの形式検証にはrumdlを使用。
- 性能比較、代替ライブラリでのbuild、実DB・Auth0・MinIO疎通、production trace解析は未実施。
  実施していない項目の効果を断定していない。
- 本タスクは文書だけの変更なので`pnpm check:agent`と`pnpm build`は実行対象外。
  移行実装の完了条件には各issueで指定した。

実装時は`pnpm check:agent`を共通条件とし、Next.js関連は`pnpm build`も必須。
UI変更前にRepository Agent Instructionsに従ってStorybook MCPの指示を取得する。
UIパッケージはconsumer build、publint/attw、Storybookの検証を含める。
SDK交換は代表操作・エラー・再試行をモックで検証した後、許可された検証環境で実接続を確認する。
DB migrationやサービス契約変更は本棚卸しの実装には含めない。
