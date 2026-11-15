import type {
	FeedLease,
	FeedResult,
} from "@s-hirano-ist/s-application/rss/ports";
import type { LookupAddress } from "node:dns";
import { parseFeed, httpUrl } from "@s-hirano-ist/s-infrastructure/rss/parser";
import ipaddr from "ipaddr.js";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
export function isPublicAddress(address: string): boolean {
	try {
		return ipaddr.process(address).range() === "unicast";
	} catch {
		return false;
	}
}
const MAX_BYTES = 2 * 1024 * 1024;
async function resolveAddresses(
	hostname: string,
	signal: AbortSignal,
): Promise<LookupAddress[]> {
	signal.throwIfAborted();
	const { promise, reject } = Promise.withResolvers<never>();
	const onAbort = () => reject(new Error("Feed request timed out"));
	signal.addEventListener("abort", onAbort, { once: true });
	try {
		return await Promise.race([lookup(hostname, { all: true }), promise]);
	} finally {
		signal.removeEventListener("abort", onAbort);
	}
}

/** Pin DNS resolution for the actual socket; revalidate every redirect. */
export async function fetchFeed(lease: FeedLease): Promise<FeedResult> {
	const signal = AbortSignal.timeout(15000);
	let currentUrl = new URL(httpUrl(lease.url));
	for (let redirect = 0; redirect <= 5; redirect++) {
		const url = currentUrl;
		if (url.port && !["80", "443"].includes(url.port))
			throw new Error("Non-web port");
		const hostname = url.hostname.replaceAll(/^\[|\]$/gu, "");
		const addresses = await resolveAddresses(hostname, signal);
		if (
			addresses.length === 0 ||
			addresses.some(({ address }) => !isPublicAddress(address))
		)
			throw new Error("Non-public destination");
		signal.throwIfAborted();
		const address = addresses[0];
		const response = await new Promise<import("node:http").IncomingMessage>(
			(resolve, reject) => {
				const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(
					url,
					{
						signal,
						headers: {
							"user-agent": "SPrivateRSS/1.0",
							accept:
								"application/rss+xml, application/atom+xml, application/xml, text/xml",
							"accept-encoding": "identity",
							...(lease.etag ? { "if-none-match": lease.etag } : {}),
							...(lease.lastModified
								? { "if-modified-since": lease.lastModified }
								: {}),
						},
						lookup: (_host, options, callback) => {
							if (options.all) callback(null, [address]);
							else callback(null, address.address, address.family);
						},
					},
					resolve,
				);
				req.on("error", reject);
				req.end();
			},
		);
		const status = response.statusCode ?? 500;
		if ([301, 302, 303, 307, 308].includes(status)) {
			response.destroy();
			if (!response.headers.location)
				throw new Error("Missing redirect location");
			currentUrl = new URL(httpUrl(response.headers.location, url.href));
			continue;
		}
		if (status === 304) {
			response.destroy();
			return {
				notModified: true,
				entries: [],
				title: "",
				etag: lease.etag,
				lastModified: lease.lastModified,
			};
		}
		if (
			status !== 200 ||
			(response.headers["content-encoding"] &&
				response.headers["content-encoding"] !== "identity")
		) {
			response.destroy();
			throw new Error("Feed request failed");
		}
		const chunks: Buffer[] = [];
		let size = 0;
		for await (const chunk of response) {
			const bytes = Buffer.from(chunk as Uint8Array);
			size += bytes.length;
			if (size > MAX_BYTES) {
				response.destroy();
				throw new Error("Feed too large");
			}
			chunks.push(bytes);
		}
		const parsed = parseFeed(Buffer.concat(chunks).toString("utf8"), url.href);
		const header = (name: string, max: number) =>
			typeof response.headers[name] === "string"
				? response.headers[name].slice(0, max)
				: null;
		return {
			...parsed,
			notModified: false,
			etag: header("etag", 1024),
			lastModified: header("last-modified", 128),
		};
	}
	throw new Error("Too many redirects");
}
