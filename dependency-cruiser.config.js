/** @type {import('dependency-cruiser').IConfiguration} */
const EXCLUDE_PATHS = [
	// Common infrastructure that can be imported from anywhere
	// "apps/web/src/env\\.ts",
	// "apps/web/src/prisma\\.ts",
	// "apps/web/src/minio\\.ts",
	// "apps/web/src/common/error",
	"apps/web/sentry.edge.config.ts",
	"apps/web/sentry.server.config.ts",
	".pnpm",
	// Prisma generated WASM files
	"apps/web/src/generated/.*\\.wasm",
	"apps/web/src/generated/wasm-.*-loader\\.mjs",
	"apps/web/src/env.ts",
	"/dist/",
	"/\\.vercel/",
	"packages/database/src/generated",
];

const COLLAPSE_PATTERN =
	"apps/web/src/app|apps/web/src/common/error|apps/web/src/common/utils|apps/web/src/common/auth|apps/web/src/generated|apps/web/src/components/common|apps/web/src/components/notes|apps/web/src/components/books|apps/web/src/components/articles|apps/web/src/components/images|apps/web/src/infrastructures/observability|apps/web/src/infrastructures/i18n|apps/web/src/infrastructures/auth|apps/web/src/infrastructures/books|apps/web/src/infrastructures/articles|apps/web/src/infrastructures/events|apps/web/src/infrastructures/notes|apps/web/src/infrastructures/images|packages/ui|packages/core/books|packages/core/articles|packages/core/images|packages/core/notes|packages/core/common|packages/core/errors|node_modules/(?:@[^/]+/[^/]+|[^/]+)";

/* Clean Architecture layer boundaries — migrated from eslint-plugin-boundaries
   (it cannot run under oxlint: the JS-plugin `settings` schema rejects boundaries/* keys).
   Allow-list semantics (boundaries) are translated to deny-list: from each layer, importing
   into the tracked first-party universe is forbidden unless the target is in `to.pathNot`.
   Verified: 0 false positives on the current tree; fires on deliberate violations. */
const boundaryRules = [
	{
		name: "boundary-application-inward",
		severity: "error",
		from: { path: "^packages/application/" },
		to: {
			path: "^apps/|^packages/(?!application/|core/)|(^|/)node_modules/(hono|@hono|@prisma|@sentry|sharp|jose|better-auth)(/|$)",
		},
	},
	{
		name: "boundary-infrastructure-inward",
		severity: "error",
		from: { path: "^packages/infrastructure/" },
		to: { path: "^apps/|^packages/(ui|api-client|api-contracts|scripts)/" },
	},
	{
		name: "boundary-core-shared-layers",
		severity: "error",
		from: { path: "^packages/core/" },
		to: {
			path: "^packages/(application|infrastructure|api-contracts|api-client)/",
		},
	},
	{
		name: "boundary-web-shared-layers",
		severity: "error",
		from: { path: "^apps/web/" },
		to: { path: "^packages/(application|infrastructure)/" },
	},
	{
		name: "boundary-web-frontend-only",
		severity: "error",
		comment:
			"Web may use generated contracts, never backend/domain/persistence implementations",
		from: { path: "^apps/web/" },
		to: {
			path: "^apps/backend/|^packages/(core|database|storage|search|notification|image-processing)/",
		},
	},
	{
		name: "boundary-standalone-backend",
		severity: "error",
		from: { path: "^apps/backend/" },
		to: {
			path: "^apps/web/|^packages/(ui|api-client)/|(^|/)node_modules/(next|react|react-dom)(/|$)",
		},
	},
	{
		name: "boundary-common-api-composition",
		severity: "error",
		comment: "Common API composition must not use Web application services",
		from: { path: "^apps/web/src/backend/api\\.ts$" },
		to: { path: "^apps/web/src/application-services/" },
	},
	{
		name: "boundary-backend-host-composition",
		severity: "error",
		comment: "Backend modules receive runtime dependencies through injection",
		from: { path: "^apps/backend/src/[^/]+/" },
		to: {
			path: "^apps/backend/src/(index|dev|runtime|env|error-reporter|unavailable-object-storage)\\.ts$",
		},
	},
	{
		name: "boundary-backend-books",
		severity: "error",
		from: { path: "^apps/backend/src/books/" },
		to: {
			path: "^(apps/backend/src|packages/core)/(articles|notes|books|images)/",
			pathNot: "^(apps/backend/src|packages/core)/books/",
		},
	},

	{
		name: "boundary-backend-images",
		severity: "error",
		from: { path: "^apps/backend/src/images/" },
		to: {
			path: "^(apps/backend/src|packages/core)/(articles|notes|books|images)/",
			pathNot: "^(apps/backend/src|packages/core)/images/",
		},
	},

	{
		name: "boundary-backend-runtime",
		severity: "error",
		comment: "Shared backend cannot depend on Next.js or Web implementation",
		from: { path: "^apps/backend/" },
		to: {
			path: "^apps/web/|^packages/(ui|api-client)/|(^|/)node_modules/(next|react|react-dom|server-only)(/|$)",
		},
	},
	{
		name: "boundary-backend-articles",
		severity: "error",
		from: { path: "^apps/backend/src/articles/" },
		to: {
			path: "^(apps/backend/src|packages/core)/(articles|notes|books|images)/",
			pathNot: "^(apps/backend/src|packages/core)/articles/",
		},
	},
	{
		name: "boundary-backend-notes",
		severity: "error",
		from: { path: "^apps/backend/src/notes/" },
		to: {
			path: "^(apps/backend/src|packages/core)/(articles|notes|books|images)/",
			pathNot: "^(apps/backend/src|packages/core)/notes/",
		},
	},

	{
		name: "boundary-backend-http",
		severity: "error",
		comment: "backend HTTP adapters must not depend on UI or Next.js APIs",
		from: { path: "^apps/web/src/backend/" },
		to: {
			path: "^apps/web/src/(app|loaders|components)/|^apps/web/src/infrastructures/i18n/|(^|/)node_modules/(next|react|react-dom)(/|$)",
		},
	},

	{
		name: "boundary-api-contracts",
		severity: "error",
		comment:
			"API contracts must stay independent of runtime and domain adapters",
		from: { path: "^packages/api-contracts/" },
		to: {
			path: "^(apps/web/|apps/backend/|packages/(?!api-contracts/))|(^|/)node_modules/(next|react|server-only)(/|$)",
		},
	},
	{
		name: "boundary-api-client",
		severity: "error",
		comment: "Generated clients cannot depend on backend implementation",
		from: { path: "^packages/api-client/" },
		to: {
			path: "^(apps/web/|apps/backend/|packages/(?!api-client/))|(^|/)node_modules/(next|react|server-only)(/|$)",
		},
	},
	{
		name: "boundary-appsvc-persistence-adapters",
		severity: "error",
		comment:
			"application service は Prisma・MinIO と database package を直接参照しない",
		from: { path: "^apps/web/src/application-services/" },
		to: { path: "^(apps/web/src/(prisma|minio)\\.ts|packages/database/)" },
	},
	{
		name: "boundary-mobile-push-composition",
		severity: "error",
		comment: "mobile / push の adapter は deps ファイルからのみ参照する",
		from: {
			path: "^apps/web/src/application-services/(mobile|push-notifications)/",
			pathNot: "/deps\\.ts$",
		},
		to: { path: "^apps/web/src/infrastructures/(mobile|push-notifications)/" },
	},
	{
		name: "boundary-core-shared-kernel",
		severity: "error",
		comment: "core/shared-kernel は自身のみ import 可",
		from: {
			path: "^packages/core/shared-kernel/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/core/shared-kernel/"],
		},
	},
	{
		name: "boundary-core-articles",
		severity: "error",
		comment:
			"core/articles は shared-kernel と自domainのみ（cross-domain 禁止）",
		from: {
			path: "^packages/core/articles/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/core/shared-kernel/", "^packages/core/articles/"],
		},
	},
	{
		name: "boundary-core-books",
		severity: "error",
		comment: "core/books は shared-kernel と自domainのみ（cross-domain 禁止）",
		from: {
			path: "^packages/core/books/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/core/shared-kernel/", "^packages/core/books/"],
		},
	},
	{
		name: "boundary-core-images",
		severity: "error",
		comment: "core/images は shared-kernel と自domainのみ（cross-domain 禁止）",
		from: {
			path: "^packages/core/images/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/core/shared-kernel/", "^packages/core/images/"],
		},
	},
	{
		name: "boundary-core-notes",
		severity: "error",
		comment: "core/notes は shared-kernel と自domainのみ（cross-domain 禁止）",
		from: {
			path: "^packages/core/notes/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/core/shared-kernel/", "^packages/core/notes/"],
		},
	},
	{
		name: "boundary-appsvc-articles",
		severity: "error",
		comment: "application-services/articles の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/articles/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/articles/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^apps/web/src/application-services/articles/",
				"^packages/core/articles/",
			],
		},
	},
	{
		name: "boundary-appsvc-auth",
		severity: "error",
		comment: "application-services/auth の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/auth/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^apps/web/src/application-services/auth/",
			],
		},
	},
	{
		name: "boundary-appsvc-books",
		severity: "error",
		comment: "application-services/books の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/books/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/books/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^apps/web/src/application-services/books/",
				"^packages/core/books/",
			],
		},
	},
	{
		name: "boundary-appsvc-events",
		severity: "error",
		comment: "application-services/events の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/events/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^apps/web/src/application-services/events/",
			],
		},
	},
	{
		name: "boundary-appsvc-images",
		severity: "error",
		comment: "application-services/images の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/images/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/images/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^apps/web/src/application-services/images/",
				"^packages/core/images/",
			],
		},
	},
	{
		name: "boundary-appsvc-notes",
		severity: "error",
		comment: "application-services/notes の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/notes/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/notes/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^apps/web/src/application-services/notes/",
				"^packages/core/notes/",
			],
		},
	},
	{
		name: "boundary-appsvc-search",
		severity: "error",
		comment: "application-services/search の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/search/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/search/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^apps/web/src/application-services/search/",
			],
		},
	},
	{
		name: "boundary-appsvc-users",
		severity: "error",
		comment: "application-services/users の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/users/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^apps/web/src/application-services/users/",
			],
		},
	},
	{
		name: "boundary-appsvc-common",
		severity: "error",
		comment: "application-services/common の依存許可先を制限",
		from: {
			path: "^apps/web/src/application-services/common/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^packages/core/(articles|books|images|notes)/",
				"^apps/web/src/application-services/common/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
			],
		},
	},
	{
		name: "boundary-appinfra-articles",
		severity: "error",
		comment: "infrastructures/articles の依存許可先を制限",
		from: {
			path: "^apps/web/src/infrastructures/articles/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/articles/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^packages/database/",
				"^packages/search/",
				"^packages/storage/",
				"^packages/notification/",
				"^packages/core/articles/",
			],
		},
	},
	{
		name: "boundary-appinfra-books",
		severity: "error",
		comment: "infrastructures/books の依存許可先を制限",
		from: {
			path: "^apps/web/src/infrastructures/books/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/books/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^packages/database/",
				"^packages/search/",
				"^packages/storage/",
				"^packages/notification/",
				"^packages/core/books/",
			],
		},
	},
	{
		name: "boundary-appinfra-images",
		severity: "error",
		comment: "infrastructures/images の依存許可先を制限",
		from: {
			path: "^apps/web/src/infrastructures/images/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/images/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^packages/database/",
				"^packages/search/",
				"^packages/storage/",
				"^packages/notification/",
				"^packages/core/images/",
			],
		},
	},
	{
		name: "boundary-appinfra-notes",
		severity: "error",
		comment: "infrastructures/notes の依存許可先を制限",
		from: {
			path: "^apps/web/src/infrastructures/notes/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/notes/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^packages/database/",
				"^packages/search/",
				"^packages/storage/",
				"^packages/notification/",
				"^packages/core/notes/",
			],
		},
	},
	{
		name: "boundary-appinfra-search",
		severity: "error",
		comment: "infrastructures/search の依存許可先を制限",
		from: {
			path: "^apps/web/src/infrastructures/search/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/search/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^packages/database/",
				"^packages/search/",
				"^packages/storage/",
				"^packages/notification/",
			],
		},
	},
	{
		name: "boundary-appinfra-shared",
		severity: "error",
		comment: "infrastructures/<shared系> の依存許可先を制限",
		from: {
			path: "^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/auth/",
				"^apps/backend/src/events/",
				"^apps/backend/src/observability/",
				"^apps/backend/src/notifications/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^packages/core/(articles|books|images|notes)/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/common/",
				"^packages/database/",
				"^packages/search/",
				"^packages/storage/",
				"^packages/notification/",
			],
		},
	},
	{
		name: "boundary-app-loader",
		severity: "error",
		comment: "loaders の依存許可先を制限",
		from: {
			path: "^apps/web/src/loaders/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^packages/core/shared-kernel/",
				"^packages/core/(articles|books|images|notes)/",
				"^apps/web/src/application-services/",
				"^apps/web/src/loaders/",
				"^apps/web/src/components/",
				"^apps/web/src/common/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
			],
		},
	},
	{
		name: "boundary-app-component",
		severity: "error",
		comment: "components の依存許可先を制限（pkg は ui のみ）",
		from: {
			path: "^apps/web/src/components/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/",
				"^apps/web/src/loaders/",
				"^apps/web/src/components/",
				"^apps/web/src/common/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^packages/ui/",
			],
		},
	},
	{
		name: "boundary-app-route",
		severity: "error",
		comment: "app(route) の依存許可先を制限",
		from: {
			path: "^apps/web/src/app/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				"^apps/backend/src/notifications/",
				"^apps/backend/src/auth/sign-in\\.ts$",
				"^packages/core/shared-kernel/",
				"^apps/web/src/application-services/",
				"^apps/web/src/infrastructures/(articles|books|images|notes|search)/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^apps/web/src/loaders/",
				"^apps/web/src/components/",
				"^apps/web/src/common/",
				"^apps/web/src/app/",
				"^apps/web/src/backend/http/mobile/",
				"^apps/web/src/backend/api\\.ts$",
				"^packages/ui/",
			],
		},
	},
	{
		name: "boundary-app-common",
		severity: "error",
		comment: "common の依存許可先を制限",
		from: {
			path: "^apps/web/src/common/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: [
				// Temporary in-process API host until manual backend deployment.
				"^apps/web/src/backend/(api|embedded-auth)\\.ts$",
				"^apps/backend/src/notifications/",
				"^apps/backend/src/auth/",
				"^apps/backend/src/mobile/",
				"^apps/backend/src/shared/",
				"^packages/core/shared-kernel/",
				"^apps/web/src/common/",
				"^apps/web/src/infrastructures/(auth|events|factories|i18n|observability|shared)/",
				"^packages/database/",
				"^packages/notification/",
				"^packages/storage/",
			],
		},
	},
	{
		name: "boundary-pkg-ui",
		severity: "error",
		comment: "packages/ui は自身のみ import 可",
		from: {
			path: "^packages/ui/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/ui/"],
		},
	},
	{
		name: "boundary-pkg-database",
		severity: "error",
		comment: "packages/database は自身のみ import 可",
		from: {
			path: "^packages/database/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/database/"],
		},
	},
	{
		name: "boundary-pkg-notification",
		severity: "error",
		comment: "packages/notification は自身のみ import 可",
		from: {
			path: "^packages/notification/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/notification/"],
		},
	},
	{
		name: "boundary-pkg-search",
		severity: "error",
		comment: "packages/search は search/database のみ import 可",
		from: {
			path: "^packages/search/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/search/", "^packages/database/"],
		},
	},
	{
		name: "boundary-pkg-storage",
		severity: "error",
		comment: "packages/storage は自身のみ import 可",
		from: {
			path: "^packages/storage/",
		},
		to: {
			path: "^(apps/web/src/(application-services|infrastructures|loaders|components|app|common|backend)/|packages/core/(shared-kernel|articles|books|images|notes)/|packages/(ui|database|notification|search|storage)/|apps/backend/)",
			pathNot: ["^packages/storage/"],
		},
	},
];

export default {
	forbidden: [
		{
			name: "no-circular",
			severity: "warn",
			comment:
				"This dependency is part of a circular relationship. You might want to revise " +
				"your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ",
			from: {},
			to: { circular: true },
		},
		{
			name: "no-orphans",
			comment:
				"This is an orphan module - it's likely not used (anymore?). Either use it or " +
				"remove it. If it's logical this module is an orphan (i.e. it's a config file), " +
				"add an exception for it in your dependency-cruiser configuration. By default " +
				"this rule does not scrutinize dot-files (e.g. .eslintrc.js), TypeScript declaration " +
				"files (.d.ts), tsconfig.json and some of the babel and webpack configs.",
			severity: "warn",
			from: {
				orphan: true,
				pathNot: [
					"(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$", // dot files
					"[.]d[.]ts$", // TypeScript declaration files
					"(^|/)tsconfig[.]json$", // TypeScript config
					"(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$", // other configs
					// Vitest configuration files
					"(^|/)vitest[.]config[.]ts$",
					"(^|/)vitest-setup[.]tsx$",
					// Tailwind configuration
					"(^|/)tailwind[.]config[.]ts$",
					// Next.js instrumentation files (automatically loaded)
					"apps/web/src/instrumentation\\.ts$",
					"apps/web/src/instrumentation-client\\.ts$",
					// Next.js special files (automatically loaded)
					"apps/web/src/app/robots\\.ts$",
					"apps/web/src/app/manifest\\.ts$",
					"apps/web/src/app/api/.*/route\\.ts$", // API routes
					"apps/web/src/generated/runtime/.*",
					// Files imported via path aliases (@/, @s-hirano-ist/s-core/) that dependency-cruiser cannot resolve
					// These are NOT orphans - they're used but imported through tsconfig path mappings
					"\\.interface\\.ts$",
					"packages/core/.*/types/.*\\.ts$",
					"apps/web/src/loaders/types\\.ts$",
					"apps/web/src/common/types\\.ts$",
					"apps/web/src/components/common/layouts/cards/types\\.ts$",
				],
			},
			to: {},
		},
		{
			name: "no-deprecated-core",
			comment:
				"A module depends on a node core module that has been deprecated. Find an alternative - these are " +
				"bound to exist - node doesn't deprecate lightly.",
			severity: "warn",
			from: {
				// Exclude Prisma generated files from this check
				pathNot: ["apps/web/src/generated/.*"],
			},
			to: {
				dependencyTypes: ["core"],
				path: [
					"^v8/tools/codemap$",
					"^v8/tools/consarray$",
					"^v8/tools/csvparser$",
					"^v8/tools/logreader$",
					"^v8/tools/profile_view$",
					"^v8/tools/profile$",
					"^v8/tools/SourceMap$",
					"^v8/tools/splaytree$",
					"^v8/tools/tickprocessor-driver$",
					"^v8/tools/tickprocessor$",
					"^node-inspect/lib/_inspect$",
					"^node-inspect/lib/internal/inspect_client$",
					"^node-inspect/lib/internal/inspect_repl$",
					// async_hooks is intentionally used via the stable AsyncLocalStorage
					// API for tenant isolation (see apps/web/src/common/tenant/tenant-context.ts).
					"^punycode$",
					"^domain$",
					"^constants$",
					"^sys$",
					"^_linklist$",
					"^_stream_wrap$",
				],
			},
		},
		{
			name: "not-to-deprecated",
			comment:
				"This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later " +
				"version of that module, or find an alternative. Deprecated modules are a security risk.",
			severity: "warn",
			from: {},
			to: {
				dependencyTypes: ["deprecated"],
			},
		},
		{
			name: "no-non-package-json",
			severity: "error",
			comment:
				"This module depends on an npm package that isn't in the 'dependencies' section of your package.json. " +
				"That's problematic as the package either (1) won't be available on live (2 - worse) will be " +
				"available on live with an non-guaranteed version. Fix it by adding the package to the dependencies " +
				"in your package.json.",
			from: {},
			to: {
				dependencyTypes: ["npm-no-pkg", "npm-unknown"],
			},
		},
		{
			name: "not-to-unresolvable",
			comment:
				"This module depends on a module that cannot be found ('resolved to disk'). If it's an npm " +
				"module: add it to your package.json. In all other cases you likely already know what to do.",
			severity: "error",
			from: {},
			to: {
				couldNotResolve: true,
				// Exclude react/jsx-runtime (false positive from tsconfig jsx: react-jsx)
				pathNot: ["^react/jsx-runtime$"],
			},
		},
		{
			name: "no-duplicate-dep-types",
			comment:
				"Likely this module depends on an external ('npm') package that occurs more than once " +
				"in your package.json i.e. bot as a devDependencies and in dependencies. This will cause " +
				"maintenance problems later on.",
			severity: "warn",
			from: {},
			to: {
				moreThanOneDependencyType: true,
				// as it's pretty common to have a type import be a type only import
				// _and_ (e.g.) a devDependency - don't consider type-only dependency
				// types for this rule
				dependencyTypesNot: ["type-only"],
			},
		},

		/* rules you might want to tweak for your specific situation: */

		{
			name: "not-to-spec",
			comment:
				"This module depends on a spec (test) file. The sole responsibility of a spec file is to test code. " +
				"If there's something in a spec that's of use to other modules, it doesn't have that single " +
				"responsibility anymore. Factor it out into (e.g.) a separate utility/ helper or a mock.",
			severity: "error",
			from: {},
			to: {
				path: "[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$",
			},
		},
		{
			name: "not-to-dev-dep",
			severity: "error",
			comment:
				"This module depends on an npm package from the 'devDependencies' section of your " +
				"package.json. It looks like something that ships to production, though. To prevent problems " +
				"with npm packages that aren't there on production declare it (only!) in the 'dependencies'" +
				"section of your package.json. If this module is development only - add it to the " +
				"from.pathNot re of the not-to-dev-dep rule in the dependency-cruiser configuration",
			from: {
				path: "^(apps/web/src|packages/.*/src|apps/backend/src)",
				pathNot: "[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$",
			},
			to: {
				dependencyTypes: ["npm-dev"],
				// type only dependencies are not a problem as they don't end up in the
				// production code or are ignored by the runtime.
				dependencyTypesNot: ["type-only"],
				pathNot: ["node_modules/@types/"],
			},
		},
		{
			name: "optional-deps-used",
			severity: "info",
			comment:
				"This module depends on an npm package that is declared as an optional dependency " +
				"in your package.json. As this makes sense in limited situations only, it's flagged here. " +
				"If you're using an optional dependency here by design - add an exception to your" +
				"dependency-cruiser configuration.",
			from: {},
			to: {
				dependencyTypes: ["npm-optional"],
			},
		},
		{
			name: "peer-deps-used",
			comment:
				"This module depends on an npm package that is declared as a peer dependency " +
				"in your package.json. This makes sense if your package is e.g. a plugin, but in " +
				"other cases - maybe not so much. If the use of a peer dependency is intentional " +
				"add an exception to your dependency-cruiser configuration.",
			severity: "warn",
			from: {},
			to: {
				dependencyTypes: ["npm-peer"],
			},
		},

		...boundaryRules,
	],
	options: {
		/* Which modules not to follow further when encountered */
		doNotFollow: {
			/* path: an array of regular expressions in strings to match against */
			path: [
				"node_modules",
				"\\.stories\\.(ts|tsx|js|jsx)$",
				"\\.(test|spec)\\.(ts|tsx|js|jsx)$",
				"^\\.next",
			],
		},

		/* Which modules to exclude */
		exclude: {
			/* path: an array of regular expressions in strings to match against */
			path: EXCLUDE_PATHS,
		},

		/* if true combines the package.jsons found from the module up to the base
       folder the cruise is initiated from. Useful for how (some) mono-repos
       manage dependencies & dependency definitions.
     */
		combinedDependencies: true,
		/* TypeScript project file ('tsconfig.json') to use for
       (1) compilation and
       (2) resolution (e.g. with the paths property)

       We use the root tsconfig.json which contains path mappings for the monorepo.
     */
		tsConfig: {
			fileName: "tsconfig.json",
		},

		/* options to pass on to enhanced-resolve, the package dependency-cruiser
       uses to resolve module references to disk.
     */
		enhancedResolveOptions: {
			exportsFields: ["exports"],
			conditionNames: ["import", "require", "node", "default", "types"],
			mainFields: ["module", "main", "types", "typings"],
		},

		/* skipAnalysisNotInRules will make dependency-cruiser execute
       analysis strictly necessary for checking the rule set only.
     */
		skipAnalysisNotInRules: true,

		reporterOptions: {
			mermaid: {
				/* 既定の minify:true はノードIDを16進ハッシュ化（0, 1A, 1E ...）し、
           数字始まりIDで mermaid(GitHub等)のパースが壊れる。false で
           読みやすいパスベースの英字始まりIDにし、レンダリング可能にする。 */
				minify: false,
			},
			dot: {
				/* pattern of modules that can be consolidated in the detailed
           graphical dependency graph.
         */
				collapsePattern: COLLAPSE_PATTERN,

				theme: {
					graph: {
						splines: "true",
					},
					dependencies: [
						{
							criteria: {
								resolved: EXCLUDE_PATHS,
							},
							attributes: {
								style: "invis",
							},
						},
					],
				},
			},
			archi: {
				collapsePattern: "node_modules/(?:@[^/]+/[^/]+|[^/]+)",
			},
			text: {
				highlightFocused: true,
			},
		},
	},
};
