export function buildCspHeader(nonce: string, isDevelopment: boolean): string {
	const scriptSrc = [
		"'self'",
		`'nonce-${nonce}'`,
		"'strict-dynamic'",
		"https://va.vercel-scripts.com",
		"https://vercel.live",
		...(isDevelopment ? ["'unsafe-eval'", "https://unpkg.com"] : []),
	].join(" ");

	const directives = [
		`default-src 'self' https://vercel.live`,
		`connect-src 'self' https://vercel.live https://va.vercel-scripts.com`,
		`script-src ${scriptSrc}`,
		`style-src 'self' 'unsafe-inline'`,
		`img-src 'self' blob: data: https://${process.env.MINIO_HOST}:${process.env.MINIO_PORT}`,
		`font-src 'self'`,
		`object-src 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
		`frame-ancestors 'none'`,
		`worker-src 'self' blob:`,
		`manifest-src 'self' ${process.env.AUTH0_ISSUER_BASE_URL}`,
		"upgrade-insecure-requests",
		`report-uri ${process.env.SENTRY_REPORT_URL}`,
		"report-to csp-endpoint",
	];

	return directives.join("; ");
}
