import { ApiError } from "@s-hirano-ist/s-api-client/models";
import { responseContracts } from "@s-hirano-ist/s-api-client/response-contracts";

export type ApiTransportOptions = {
	/** Includes /api/v1; trailing slash is optional. */
	baseURL: string;
	fetch?: typeof globalThis.fetch;
	/** Cookie or Authorization is supplied for this request/client only. */
	headers?: HeadersInit;
};

export class ApiHttpError extends Error {
	constructor(
		public readonly status: number,
		public readonly code: ApiError["error"]["code"],
	) {
		super(code);
		this.name = "ApiHttpError";
	}
}
export class ApiProtocolError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ApiProtocolError";
	}
}

/** Request-scoped transport, also usable with an in-process Hono fetch adapter. */
export function createApiFetch(
	config: ApiTransportOptions,
): typeof globalThis.fetch {
	const baseURL = new URL(
		config.baseURL.endsWith("/") ? config.baseURL : `${config.baseURL}/`,
	);
	if (
		!["http:", "https:"].includes(baseURL.protocol) ||
		baseURL.username ||
		baseURL.password
	)
		throw new ApiProtocolError("Invalid API base URL");
	return async (input, init) => {
		if (
			typeof input !== "string" ||
			!input.startsWith("/") ||
			input.startsWith("//") ||
			input.includes("#")
		)
			throw new ApiProtocolError("Expected a generated API path");
		const url = new URL(`.${input}`, baseURL);
		if (
			url.origin !== baseURL.origin ||
			!url.pathname.startsWith(baseURL.pathname)
		)
			throw new ApiProtocolError("API path escaped the configured backend");
		const method = init?.method ?? "GET";
		const path = url.pathname.slice(baseURL.pathname.length - 1);
		const route = responseContracts.find(
			(candidate) => candidate.method === method && candidate.path.test(path),
		);
		if (!route) throw new ApiProtocolError("Unknown API operation");
		const headers = new Headers(config.headers);
		new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
		const response = await (config.fetch ?? globalThis.fetch)(url, {
			...init,
			headers,
			cache: "no-store",
			redirect: "error",
		});
		const contract = route.responses[response.status];
		if (!contract)
			throw new ApiProtocolError(
				`Undocumented HTTP status: ${response.status}`,
			);
		if (contract.kind === "json") {
			const contentType = response.headers
				.get("content-type")
				?.split(";", 1)[0]
				.trim()
				.toLowerCase();
			if (contentType !== "application/json")
				throw new ApiProtocolError("Expected a JSON API response");
			const payload: unknown = await response
				.clone()
				.json()
				.catch(() => {
					throw new ApiProtocolError("Invalid JSON API response");
				});
			const result = contract.schema.safeParse(payload);
			if (!result.success)
				throw new ApiProtocolError("API response does not match its contract");
			if (!response.ok) {
				const error = ApiError.parse(result.data);
				throw new ApiHttpError(response.status, error.error.code);
			}
		}
		return response;
	};
}
