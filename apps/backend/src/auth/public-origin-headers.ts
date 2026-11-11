/** Call only after the caller has validated the public origin. */
export function publicOriginHeaders(source: Headers, origin: string): Headers {
	const headers = new Headers(source);
	for (const name of [
		"x-s-private-web-origin",
		"x-forwarded-host",
		"x-forwarded-proto",
		"forwarded",
	])
		headers.delete(name);
	headers.set("host", new URL(origin).host);
	return headers;
}
