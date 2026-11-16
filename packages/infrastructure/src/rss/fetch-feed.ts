import type { RssFetchFailure } from "@s-hirano-ist/s-application/rss/failure";
import type {
	FeedLease,
	FeedResult,
} from "@s-hirano-ist/s-application/rss/ports";
import type { LookupAddress } from "node:dns";
import { RssFetchError } from "@s-hirano-ist/s-application/rss/failure";
import { decodeFeedXml } from "@s-hirano-ist/s-infrastructure/rss/decode";
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
	const started = performance.now();
	const diagnostic: RssFetchFailure = {
		stage: "url",
		reason: "invalid_url",
		durationMs: 0,
		redirects: 0,
		bytes: 0,
	};
	const signal = AbortSignal.timeout(15000);
	try {
		return await fetchValidatedFeed(lease, signal, diagnostic);
	} catch (error) {
		if (diagnostic.stage === "parse" && error instanceof Error) {
			const reasons = {
				"Invalid XML": "invalid_xml",
				"Expected RSS 1.0, RSS 2.0 or Atom": "unsupported_feed",
				"Too many entries": "entry_limit",
			} as const;
			if (Object.hasOwn(reasons, error.message))
				diagnostic.reason = reasons[error.message as keyof typeof reasons];
		}
		if (diagnostic.stage === "decode" && error instanceof RangeError)
			diagnostic.reason = "unsupported_charset";
		if (signal.aborted) diagnostic.reason = "timeout";
		diagnostic.durationMs = Math.round(performance.now() - started);
		diagnostic.networkCode = safeNetworkCode(error);
		throw new RssFetchError(diagnostic);
	}
}

async function fetchValidatedFeed(
	lease: FeedLease,
	signal: AbortSignal,
	diagnostic: RssFetchFailure,
): Promise<FeedResult> {
	let currentUrl = new URL(httpUrl(lease.url));
	for (let redirect = 0; redirect <= 5; redirect++) {
		const url = currentUrl;
		diagnostic.stage = "url";
		diagnostic.reason = "invalid_url";
		diagnostic.hostname = url.hostname;
		diagnostic.redirects = redirect;
		diagnostic.httpStatus = undefined;
		if (url.port && !["80", "443"].includes(url.port)) {
			diagnostic.reason = "blocked_port";
			throw new Error("Non-web port");
		}
		const hostname = url.hostname.replaceAll(/^\[|\]$/gu, "");
		diagnostic.stage = "dns";
		diagnostic.reason = "dns_error";
		const addresses = await resolveAddresses(hostname, signal);
		if (
			addresses.length === 0 ||
			addresses.some(({ address }) => !isPublicAddress(address))
		) {
			diagnostic.reason = "blocked_destination";
			throw new Error("Non-public destination");
		}
		signal.throwIfAborted();
		const address = addresses[0];
		diagnostic.stage = "http";
		diagnostic.reason = "network_error";
		const response = await openResponse(url, lease, address, signal);
		const status = response.statusCode ?? 500;
		diagnostic.httpStatus = status;
		if ([301, 302, 303, 307, 308].includes(status)) {
			response.destroy();
			if (!response.headers.location) {
				diagnostic.reason = "missing_redirect";
				throw new Error("Missing redirect location");
			}
			diagnostic.stage = "url";
			diagnostic.reason = "invalid_url";
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
			diagnostic.reason =
				status === 200 ? "unsupported_encoding" : "http_status";
			throw new Error("Feed request failed");
		}
		return readResponse(response, url, diagnostic);
	}
	diagnostic.stage = "http";
	diagnostic.reason = "redirect_limit";
	diagnostic.redirects = 6;
	throw new Error("Too many redirects");
}

async function readResponse(
	response: import("node:http").IncomingMessage,
	url: URL,
	diagnostic: RssFetchFailure,
): Promise<FeedResult> {
	diagnostic.stage = "body";
	diagnostic.reason = "body_error";
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of response) {
		const bytes = Buffer.from(chunk as Uint8Array);
		size += bytes.length;
		diagnostic.bytes = size;
		if (size > MAX_BYTES) {
			response.destroy();
			diagnostic.reason = "body_too_large";
			throw new Error("Feed too large");
		}
		chunks.push(bytes);
	}
	diagnostic.stage = "decode";
	diagnostic.reason = "invalid_text";
	const contentType = response.headers["content-type"];
	const xml = decodeFeedXml(
		Buffer.concat(chunks),
		typeof contentType === "string" ? contentType : undefined,
	);
	diagnostic.stage = "parse";
	diagnostic.reason = "parse_error";
	const parsed = parseFeed(xml, url.href);
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

function openResponse(
	url: URL,
	lease: FeedLease,
	address: LookupAddress,
	signal: AbortSignal,
) {
	return new Promise<import("node:http").IncomingMessage>((resolve, reject) => {
		const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(
			url,
			{
				signal,
				headers: {
					"user-agent": "SPrivateRSS/1.0",
					accept:
						"application/rss+xml, application/rdf+xml, application/atom+xml, application/xml, text/xml",
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
	});
}

function safeNetworkCode(error: unknown): string | undefined {
	if (typeof error !== "object" || error === null || !("code" in error))
		return undefined;
	const allowed = [
		"ENOTFOUND",
		"EAI_AGAIN",
		"ECONNRESET",
		"ECONNREFUSED",
		"ETIMEDOUT",
		"ENETUNREACH",
		"EHOSTUNREACH",
		"EPIPE",
		"CERT_HAS_EXPIRED",
		"DEPTH_ZERO_SELF_SIGNED_CERT",
		"UNABLE_TO_VERIFY_LEAF_SIGNATURE",
		"ERR_TLS_CERT_ALTNAME_INVALID",
		"ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED",
	];
	return typeof error.code === "string" && allowed.includes(error.code)
		? error.code
		: undefined;
}
