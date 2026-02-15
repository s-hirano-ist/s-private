import type { RequestOptions } from "node:http";
import * as https from "node:https";
import type { ClientOptions } from "minio";

type Transport = NonNullable<ClientOptions["transport"]>;

/**
 * Create a custom transport that injects CF-Access headers for Cloudflare Tunnel authentication.
 * Returns undefined if CF_ACCESS environment variables are not set (e.g., local development).
 */
export function createCfAccessTransport(): Transport | undefined {
	const clientId = process.env.CF_ACCESS_CLIENT_ID;
	const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return undefined;
	}

	return {
		request(options: string | URL | RequestOptions, ...rest: unknown[]) {
			if (typeof options === "object" && !(options instanceof URL)) {
				const headers = (options.headers ?? {}) as Record<string, string>;
				headers["CF-Access-Client-Id"] = clientId;
				headers["CF-Access-Client-Secret"] = clientSecret;
				options.headers = headers;
			}

			// biome-ignore lint/suspicious/noExplicitAny: https.request has complex overloads incompatible with Transport type
			return (https.request as any)(options, ...rest);
		},
	} as Transport;
}
