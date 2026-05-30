import type { CfAccessConfig } from "./types.ts";
import type { ClientOptions } from "minio";
import type { RequestOptions } from "node:http";
import * as https from "node:https";

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

			// https.request has complex overloads incompatible with Transport type
			// oxlint-disable-next-line typescript/no-explicit-any
			return (https.request as any)(options, ...rest);
		},
	};
}
