import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
// FIXME: env.tsの読み込み（Node v23じゃないと動かない... process.envの排除
// import { env } from "./src/env.ts";
// await import("./src/env.ts");
import createNextIntlPlugin from "next-intl/plugin";

// MEMO: scriptタグを利用する必要が出たときはnonceの利用推奨
// https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy#reading-the-nonce

// MEMO: その他のheadersについては下記参照
// https://nextjs.org/docs/pages/api-reference/next-config-js/headers

// MEMO: worker-src 'self' blob:; for Sentry

const cspHeader = `
    default-src 'self' https://vercel.live;
	connect-src 'self';
	script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com https://va.vercel-scripts.com https://vercel.live;
    style-src 'self' 'unsafe-inline';
	img-src 'self' blob: data: https://${process.env.MINIO_HOST}:${process.env.MINIO_PORT};
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
	worker-src 'self' blob:;
	manifest-src 'self' ${process.env.AUTH0_ISSUER_BASE_URL};
    upgrade-insecure-requests;
	report-uri ${process.env.SENTRY_REPORT_URL};
    report-to csp-endpoint;
	`;

/** @type {import('next').NextConfig} */
const nextConfig = {
	serverExternalPackages: ["sharp"],
	typedRoutes: true,
	experimental: {
		serverActions: { bodySizeLimit: "100mb" }, // FIXME: due to DDoS attacks
		authInterrupts: true,
		staleTimes: {
			dynamic: 30,
			static: 180,
		},
		viewTransition: true,
		useCache: true,
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
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Content-Security-Policy",
						value: cspHeader.replaceAll("\n", ""),
					},
					{
						key: "Report-To",
						value: `{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"${process.env.SENTRY_REPORT_URL}"}],"include_subdomains":true}`,
					},
				],
			},
		];
	},
};

const withNextIntl = createNextIntlPlugin(
	"src/infrastructures/i18n/request.ts",
);
const bundleAnalyzer = withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});

export default withNextIntl(
	bundleAnalyzer(
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

			// Webpack-related settings
			webpack: {
				// Automatically annotate React components to show their full name in breadcrumbs and session replay
				reactComponentAnnotation: { enabled: true },
				// Automatically tree-shake Sentry logger statements to reduce bundle size
				treeshake: { removeDebugLogging: true },
				// Enables automatic instrumentation of Vercel Cron Monitors
				// See: https://docs.sentry.io/product/crons/ and https://vercel.com/docs/cron-jobs
				automaticVercelMonitors: true,
			},
		}),
	),
);
