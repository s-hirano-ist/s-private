export type RssFetchStage = "url" | "dns" | "http" | "body" | "parse";
export type RssFetchReason =
	| "invalid_url"
	| "blocked_port"
	| "dns_error"
	| "blocked_destination"
	| "network_error"
	| "timeout"
	| "missing_redirect"
	| "redirect_limit"
	| "http_status"
	| "unsupported_encoding"
	| "body_error"
	| "body_too_large"
	| "parse_error"
	| "invalid_xml"
	| "unsupported_feed"
	| "entry_limit";
export type RssFetchFailure = {
	bytes: number;
	durationMs: number;
	hostname?: string;
	httpStatus?: number;
	networkCode?: string;
	reason: RssFetchReason;
	redirects: number;
	stage: RssFetchStage;
};
/** Safe diagnostics only: never attach the original error, URL or response body. */
export class RssFetchError extends Error {
	constructor(readonly diagnostic: RssFetchFailure) {
		super(`RSS fetch failed: ${diagnostic.reason}`);
		this.name = "RssFetchError";
	}
}
export type RssRefreshFailure = {
	bytes?: number;
	durationMs: number;
	feedId: string;
	hostname?: string;
	httpStatus?: number;
	networkCode?: string;
	reason: RssFetchReason | "storage_error" | "unknown_error";
	redirects?: number;
	stage: RssFetchStage | "claim" | "complete" | "release" | "fetch";
	storageCode?: string;
};
export type RssFailureReporter = (failure: RssRefreshFailure) => Promise<void>;
