const CSP_REPORTING_GROUP = "csp-endpoint";
// Next.js can emit this deterministic inline style on error/streaming responses.
const NEXT_INLINE_STYLE_HASH =
	"'sha256-Wwucq8eX2r0YFymkQhDXm5hN0+FfSvI3s4JSSaqa4iw='";

// next-themes disableTransitionOnChange inserts this deterministic style.
const NEXT_THEMES_STYLE_HASH =
	"'sha256-skqujXORqzxt1aE0NNXxujEanPTX6raoqSscTV/Ww/Y='";

// @sentry/feedback 11.11.0: system-theme host variables and the screenshot-free dialog.
// Production Feedback E2E verifies these exact SDK styles and rejects unknown styles.
const SENTRY_FEEDBACK_STYLE_HASHES = [
	"'sha256-k/rwOSsvlNlNYj8OPfXXYaKUZm988AtmHk5Wa6ABsgE='",
	"'sha256-G61BLZZF0fr2BDlAVwUrUSRuH8VwG0dfrT02Cjnd7fE='",
];

type ContentSecurityPolicyOptions = {
	isDevelopment: boolean;
	isPreview: boolean;
	reportUrl?: string;
};

function compactDirectives(directives: string[]): string {
	return directives.join("; ");
}

export function buildContentSecurityPolicy({
	isDevelopment,
	isPreview,
	reportUrl,
}: ContentSecurityPolicyOptions): string {
	const allowsVercelToolbar = isPreview;
	const allowsInlineStyleElements = isDevelopment || allowsVercelToolbar;

	const scriptSources = ["'self'", ...(isDevelopment ? ["'unsafe-eval'"] : [])];
	const scriptElementSources = [
		"'self'",
		// Next.js 16/Vercel can emit parser-inserted framework scripts during
		// streamed/error responses. Preserve the existing compatibility fallback.
		"'unsafe-inline'",
		"https://va.vercel-scripts.com",
		...(allowsVercelToolbar ? ["https://vercel.live"] : []),
	];
	const styleElementSources = allowsInlineStyleElements
		? [
				"'self'",
				"'unsafe-inline'",
				...(allowsVercelToolbar ? ["https://vercel.live"] : []),
			]
		: [
				"'self'",
				NEXT_INLINE_STYLE_HASH,
				NEXT_THEMES_STYLE_HASH,
				...SENTRY_FEEDBACK_STYLE_HASHES,
			];
	const imageSources = [
		"'self'",
		"blob:",
		"data:",
		"https://books.google.com",
		"https://s-hirano.com",
		...(allowsVercelToolbar
			? ["https://vercel.live", "https://vercel.com"]
			: []),
	];
	const connectSources = [
		"'self'",
		...(isDevelopment ? ["ws:", "wss:"] : []),
		...(allowsVercelToolbar
			? ["https://vercel.live", "wss://ws-us3.pusher.com"]
			: []),
	];
	const fontSources = [
		"'self'",
		...(allowsVercelToolbar
			? ["https://vercel.live", "https://assets.vercel.com"]
			: []),
	];

	return compactDirectives([
		"default-src 'self'",
		`script-src ${scriptSources.join(" ")}`,
		`script-src-elem ${scriptElementSources.join(" ")}`,
		`style-src ${styleElementSources.join(" ")}`,
		`style-src-elem ${styleElementSources.join(" ")}`,
		"style-src-attr 'unsafe-inline'",
		`img-src ${imageSources.join(" ")}`,
		`connect-src ${connectSources.join(" ")}`,
		`font-src ${fontSources.join(" ")}`,
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		...(allowsVercelToolbar ? ["frame-src https://vercel.live"] : []),
		"worker-src 'self' blob:",
		"manifest-src 'self'",
		...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
		...(reportUrl ? [`report-uri ${reportUrl}`] : []),
		`report-to ${CSP_REPORTING_GROUP}`,
	]);
}
