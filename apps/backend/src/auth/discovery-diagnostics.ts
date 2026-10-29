import { AsyncLocalStorage } from "node:async_hooks";
import { channel } from "node:diagnostics_channel";

const networkCodes = new Set([
	"ENOTFOUND",
	"EAI_AGAIN",
	"ECONNREFUSED",
	"ECONNRESET",
	"ETIMEDOUT",
	"ENETUNREACH",
	"EHOSTUNREACH",
	"UND_ERR_CONNECT_TIMEOUT",
	"UND_ERR_HEADERS_TIMEOUT",
	"UND_ERR_BODY_TIMEOUT",
	"UND_ERR_SOCKET",
	"CERT_HAS_EXPIRED",
	"ERR_TLS_CERT_ALTNAME_INVALID",
	"UNABLE_TO_VERIFY_LEAF_SIGNATURE",
	"DEPTH_ZERO_SELF_SIGNED_CERT",
	"SELF_SIGNED_CERT_IN_CHAIN",
	"UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
]);
const scope = new AsyncLocalStorage<{ codes: Set<string>; url: URL }>();

function collectCodes(error: unknown, codes: Set<string>, depth = 0): void {
	if (depth > 3 || typeof error !== "object" || error === null) return;
	if (
		"code" in error &&
		typeof error.code === "string" &&
		networkCodes.has(error.code)
	)
		codes.add(error.code);
	if (error instanceof AggregateError)
		for (const cause of error.errors.slice(0, 5))
			collectCodes(cause, codes, depth + 1);
	if (error instanceof Error) collectCodes(error.cause, codes, depth + 1);
}

/** No request, URL, header or raw network error leaves this subscriber. */
export async function withDiscoveryDiagnostics<T>(
	url: URL,
	operation: () => Promise<T>,
	codes: Set<string>,
): Promise<T> {
	const errors = channel("undici:request:error");
	const listener = (message: unknown) => {
		const current = scope.getStore();
		if (
			!current ||
			current.codes !== codes ||
			typeof message !== "object" ||
			message === null ||
			!("request" in message)
		)
			return;
		const request = message.request;
		if (
			typeof request !== "object" ||
			request === null ||
			!("origin" in request) ||
			!("path" in request)
		)
			return;
		if (
			String(request.origin) !== current.url.origin ||
			request.path !== current.url.pathname
		)
			return;
		if ("error" in message) collectCodes(message.error, current.codes);
	};
	errors.subscribe(listener);
	try {
		return await scope.run({ url, codes }, operation);
	} finally {
		errors.unsubscribe(listener);
	}
}
