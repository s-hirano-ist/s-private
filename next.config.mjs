import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./src/env.mjs";
await import("./src/env.mjs");

// MEMO: scriptタグを利用する必要が出たときはnonceの利用推奨
// https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy#reading-the-nonce

// MEMO: その他のheadersについては下記参照
// https://nextjs.org/docs/pages/api-reference/next-config-js/headers

// MEMO: worker-src 'self' blob:; for Sentry

const cspHeader = `
    default-src 'self';
	connect-src 'self' https://www.google-analytics.com;
	script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
	img-src 'self' blob: data: https://localhost:9000 https://private.s-hirano.com:9000 https://www.googletagmanager.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
	worker-src 'self' blob:;
    upgrade-insecure-requests;
	report-uri ${env.SENTRY_REPORT_URL};
    report-to csp-endpoint;
	`;

/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		typedRoutes: true,
		serverActions: { bodySizeLimit: "100mb" }, // FIXME: due to DDoS attacks
	},
	pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
	output: "standalone",
	images: { remotePatterns: [{ hostname: env.MINIO_HOST }] },
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
						value: cspHeader.replace(/\n/g, ""),
					},
					{
						key: "Report-To",
						value: `{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"${env.SENTRY_REPORT_URL}"}],"include_subdomains":true}`,
					},
				],
			},
		];
	},
};

export default withSentryConfig(nextConfig, {
	// For all available options, see:
	// https://github.com/getsentry/sentry-webpack-plugin#options

	org: "s-hirano-ist",
	project: "s-private",

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Automatically annotate React components to show their full name in breadcrumbs and session replay
	reactComponentAnnotation: { enabled: true },

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	// Hides source maps from generated client bundles
	hideSourceMaps: true,

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

	// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
	// See the following for more information:
	// https://docs.sentry.io/product/crons/
	// https://vercel.com/docs/cron-jobs
	automaticVercelMonitors: true,

	sourcemaps: { deleteSourcemapsAfterUpload: true },
});
