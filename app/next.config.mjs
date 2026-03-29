import { withSentryConfig } from "@sentry/nextjs";
// FIXME: env.tsの読み込み（Node v23じゃないと動かない... process.envの排除
// import { env } from "./src/env.ts";
// await import("./src/env.ts");
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: [
		"@s-hirano-ist/s-core",
		"@s-hirano-ist/s-notification",
		"@s-hirano-ist/s-search",
	],
	serverExternalPackages: ["sharp", "@prisma/client"],
	typedRoutes: true,
	reactCompiler: true,
	cacheComponents: true, // v16: moved from experimental.useCache
	experimental: {
		authInterrupts: true,
		staleTimes: {
			dynamic: 0,
			static: 180,
		},
		viewTransition: true,
		serverActions: {
			bodySizeLimit: "10mb",
			allowedOrigins: ["s-hirano.com", "*.vercel.app", "localhost:3000"],
		},
	},
	pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
	output: "standalone",
	images: {
		remotePatterns: [
			{ hostname: process.env.MINIO_HOST ?? "" },
			{
				protocol: "https",
				hostname: "books.google.com",
			},
			{
				protocol: "https",
				hostname: "s-hirano.com",
			},
		],
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains; preload",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Cache-Control",
						value: "private, no-store, must-revalidate",
					},
					{
						key: "Report-To",
						value: `{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"${process.env.SENTRY_REPORT_URL}"}],"include_subdomains":true}`,
					},
				],
			},
			{
				source: "/_next/static/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},
};

const withNextIntl = createNextIntlPlugin(
	"./src/infrastructures/i18n/request.ts",
);

export default withNextIntl(
	withSentryConfig(nextConfig, {
		// For all available options, see:
		// https://www.npmjs.com/package/@sentry/webpack-plugin#options

		org: "s-hirano-ist-z2",
		project: "s-private-sentry",

		// Only print logs for uploading source maps in CI
		silent: !process.env.CI,

		// Disable telemetry
		telemetry: false,

		// For all available options, see:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

		// Upload a larger set of source maps for prettier stack traces (increases build time)
		widenClientFileUpload: true,

		// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
		// This can increase your server load as well as your hosting bill.
		// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
		// side errors will fail.
		tunnelRoute: "/monitoring",

		// Hides source maps from generated client bundles
		hideSourceMaps: true,

		sourcemaps: { deleteSourcemapsAfterUpload: true },

		bundleSizeOptimizations: {
			excludeDebugStatements: true,
		},
	}),
);
