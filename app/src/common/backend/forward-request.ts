const forwardedHeaders = [
	"accept",
	"authorization",
	"content-type",
	"cookie",
	"origin",
];

/** Fixed upstream + explicit headers; OAuth redirects and media bodies stay untouched. */
export async function forwardBackendRequest(
	request: Request,
	backendURL: string,
	fetcher: typeof fetch = fetch,
): Promise<Response> {
	const source = new URL(request.url);
	if (!/^\/api\/(?:v1\/|auth\/|sign-in$)/u.test(source.pathname))
		return new Response(null, { status: 404 });
	const target = new URL(source.pathname + source.search, backendURL);
	const headers = new Headers();
	for (const name of forwardedHeaders) {
		const value = request.headers.get(name);
		if (value !== null) headers.set(name, value);
	}
	headers.set("x-s-private-web-origin", source.origin);
	// Bodyless DELETE/complete must not access the Next.js Request body proxy.
	const hasBody =
		["POST", "PUT", "PATCH"].includes(request.method) &&
		(request.headers.has("content-type") ||
			Number(request.headers.get("content-length")) > 0);
	const response = await fetcher(target, {
		method: request.method,
		headers,
		...(hasBody ? { body: await request.arrayBuffer() } : {}),
		signal: request.signal,
		cache: "no-store",
		redirect: "manual",
	});
	const responseHeaders = new Headers(response.headers);
	// Node fetch decompresses upstream bodies; its original encoding/length no longer describe this stream.
	for (const name of [
		"content-encoding",
		"content-length",
		"connection",
		"keep-alive",
		"proxy-authenticate",
		"proxy-authorization",
		"te",
		"trailer",
		"transfer-encoding",
		"upgrade",
	])
		responseHeaders.delete(name);
	responseHeaders.set("cache-control", "private, no-store");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
	});
}
