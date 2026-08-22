const CHARSET_ALIASES: Readonly<Record<string, string>> = {
	eucjp: "euc-jp",
	sjis: "shift_jis",
	shiftjis: "shift_jis",
	utf8: "utf-8",
	xeucjp: "euc-jp",
	xsjis: "shift_jis",
};

export function normalizeCharset(charset: string): string {
	const trimmed = charset.trim().replaceAll(/^['"]|['"]$/gu, "");
	const normalized = trimmed.toLowerCase().replaceAll(/[^a-z0-9]/gu, "");
	return CHARSET_ALIASES[normalized] ?? trimmed.toLowerCase();
}

export function detectHtmlCharset(headers: Headers, bytes: Uint8Array): string {
	const contentType = headers.get("content-type") ?? "";
	const headerMatch = /charset\s*=\s*["']?([^"'\s;]+)/iu.exec(contentType);
	if (headerMatch) return normalizeCharset(headerMatch[1]);

	const preview = new TextDecoder("windows-1252").decode(
		bytes.subarray(0, Math.min(4096, bytes.length)),
	);
	const metaCharset = /<meta\s{1,200}charset=["']?([^"'\s>]+)/iu.exec(preview);
	if (metaCharset) return normalizeCharset(metaCharset[1]);

	const metaHttpEquiv =
		/<meta[^>]{1,500}http-equiv=["']?Content-Type["']?[^>]{1,500}content=["'][^"']{0,500}charset=([^"'\s;]+)/iu.exec(
			preview,
		);
	if (metaHttpEquiv) return normalizeCharset(metaHttpEquiv[1]);

	return "utf-8";
}

export function decodeHtml(headers: Headers, bytes: Uint8Array): string {
	return new TextDecoder(detectHtmlCharset(headers, bytes), {
		fatal: false,
	}).decode(bytes);
}
