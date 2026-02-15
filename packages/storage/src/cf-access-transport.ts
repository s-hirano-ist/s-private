import type { RequestOptions } from "node:http";
import * as https from "node:https";
import type { ClientOptions } from "minio";
import type { CfAccessConfig } from "./types";

type Transport = NonNullable<ClientOptions["transport"]>;

export function createCfAccessTransport(
	config?: CfAccessConfig,
): Transport | undefined {
	if (!config?.clientId || !config?.clientSecret) {
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

			// biome-ignore lint/suspicious/noExplicitAny: https.request has complex overloads incompatible with Transport type
			return (https.request as any)(options, ...rest);
		},
	} as Transport;
}
