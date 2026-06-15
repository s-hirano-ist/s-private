const CSP_REPORTING_GROUP = "csp-endpoint";
// react-remove-scroll injects this deterministic zero-width scrollbar rule when
// Radix dialogs open on platforms with overlay scrollbars.
const RADIX_DIALOG_SCROLL_LOCK_STYLE_HASH =
	"'sha256-nzTgYzXYDNe6BAHiiI7NNlfK8n/auuOAhh2t92YvuXo='";

type ContentSecurityPolicyOptions = {
	isDevelopment: boolean;
	isPreview: boolean;
	minioHost?: string;
	minioPort?: string;
	nonce: string;
	reportUrl?: string;
};

function compactDirectives(directives: string[]): string {
	return directives.join("; ");
}

function getMinioOrigin(host?: string, port?: string): string | undefined {
	if (!host) return undefined;

	const normalizedPort = port && port !== "443" ? `:${port}` : "";
	return `https://${host}${normalizedPort}`;
}

export function buildContentSecurityPolicy({
	isDevelopment,
	isPreview,
	minioHost,
	minioPort,
	nonce,
	reportUrl,
}: ContentSecurityPolicyOptions): string {
	const allowsVercelToolbar = isPreview;
	const allowsInlineStyleElements = isDevelopment || allowsVercelToolbar;
	const minioOrigin = getMinioOrigin(minioHost, minioPort);

	const scriptSources = [
		"'self'",
		`'nonce-${nonce}'`,
		"'strict-dynamic'",
		...(isDevelopment ? ["'unsafe-eval'", "https://unpkg.com"] : []),
		"https://va.vercel-scripts.com",
		...(allowsVercelToolbar ? ["https://vercel.live"] : []),
	];
	const styleElementSources = allowsInlineStyleElements
		? [
				"'self'",
				"'unsafe-inline'",
				...(allowsVercelToolbar ? ["https://vercel.live"] : []),
			]
		: ["'self'", `'nonce-${nonce}'`, RADIX_DIALOG_SCROLL_LOCK_STYLE_HASH];
	const imageSources = [
		"'self'",
		"blob:",
		"data:",
		"https://books.google.com",
		"https://s-hirano.com",
		...(minioOrigin ? [minioOrigin] : []),
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
