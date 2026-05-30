import type { CfAccessConfig } from "./types.ts";
import type { ClientOptions } from "minio";
import type { RequestOptions } from "node:http";
import * as https from "node:https";

type Transport = NonNullable<ClientOptions["transport"]>;

type TransportRequest = Transport["request"];

// https.request has complex overloads incompatible with the spread call below,
// so model the exact invocation as a precise call signature instead of `any`.
type RequestCall = (
	options: string | URL | RequestOptions,
	...rest: unknown[]
) => ReturnType<TransportRequest>;

export function createCfAccessTransport(
	config?: CfAccessConfig,
): Transport | undefined {
	if (!config?.clientId || !config.clientSecret) {
		return undefined;
	}

	return {
		request(options: string | URL | RequestOptions, ...rest: unknown[]) {
			if (typeof options === "object" && !(options instanceof URL)) {
				const headers = (options.headers ?? {}) as Record<string, string>;
				headers["CF-Access-Client-Id"] = config.clientId;
				headers["CF-Access-Client-Secret"] = config.clientSecret;
				options.headers = headers;
			}

			const request = https.request as unknown as RequestCall;
			return request(options, ...rest);
		},
	};
}
