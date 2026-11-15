import type { FeedLease } from "@s-hirano-ist/s-application/rss/ports";
import { fetchFeed } from "@s-hirano-ist/s-infrastructure/rss/fetch-feed";
import { PassThrough, Readable } from "node:stream";
import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:http", () => ({ request: mocks.request }));
vi.mock("node:https", () => ({ request: mocks.request }));
const lease: FeedLease = {
	id: "feed",
	url: "https://example.com/feed",
	title: "Feed",
	folder: "",
	lastFetchedAt: null,
	error: null,
	token: "lease",
	etag: '"one"',
	lastModified: "yesterday",
};
const xml =
	"<rss><channel><title>News</title><item><link>/one</link></item></channel></rss>";
function respond(statusCode = 200, headers = {}, body = xml) {
	mocks.request.mockImplementationOnce((_url, options, callback) => {
		// Exercise the socket lookup, including Node's all-addresses variant.
		options.lookup(
			"example.com",
			{ all: true },
			(_error: unknown, addresses: unknown) => {
				expect(addresses).toEqual([{ address: "8.8.8.8", family: 4 }]);
			},
		);
		options.lookup(
			"example.com",
			{},
			(_error: unknown, address: unknown, family: unknown) => {
				expect([address, family]).toEqual(["8.8.8.8", 4]);
			},
		);
		const req = new PassThrough();
		const response = Object.assign(Readable.from([Buffer.from(body)]), {
			statusCode,
			headers,
		});
		return Object.assign(req, { end: () => callback(response) });
	});
}
beforeEach(() => {
	vi.clearAllMocks();
	mocks.request.mockReset();
	mocks.lookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);
});
test("pins public DNS for the socket, sends validators and parses relative article links", async () => {
	respond(200, { etag: '"two"', "last-modified": "today" });
	expect(await fetchFeed(lease)).toMatchObject({
		title: "News",
		notModified: false,
		etag: '"two"',
		lastModified: "today",
		entries: [{ url: "https://example.com/one" }],
	});
	expect(mocks.request.mock.calls[0][1].headers).toMatchObject({
		"if-none-match": '"one"',
		"if-modified-since": "yesterday",
		"accept-encoding": "identity",
	});
});
test("304 preserves validators and needs no XML body", async () => {
	respond(304, {}, "");
	expect(await fetchFeed(lease)).toMatchObject({
		notModified: true,
		entries: [],
		etag: lease.etag,
		lastModified: lease.lastModified,
	});
});
test("revalidates redirect DNS and rejects a rebound private target", async () => {
	respond(302, { location: "https://private.example/feed" }, "");
	mocks.lookup
		.mockResolvedValueOnce([{ address: "8.8.8.8", family: 4 }])
		.mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
	await expect(fetchFeed(lease)).rejects.toThrow("Non-public");
	expect(mocks.request).toHaveBeenCalledTimes(1);
});
test("resolves relative redirects and returns absent response validators as null", async () => {
	respond(301, { location: "/moved" }, "");
	respond();
	expect(
		await fetchFeed({ ...lease, etag: null, lastModified: null }),
	).toMatchObject({ etag: null, lastModified: null });
	expect(mocks.request.mock.calls[1][0].href).toBe("https://example.com/moved");
});
test.each([
	[500, {}],
	[200, { "content-encoding": "gzip" }],
])("rejects status/encoding %s %j", async (status, headers) => {
	respond(status, headers);
	await expect(fetchFeed(lease)).rejects.toThrow("Feed request failed");
});
test("rejects missing redirects and redirect loops", async () => {
	respond(302);
	await expect(fetchFeed(lease)).rejects.toThrow("Missing redirect");
	for (let i = 0; i < 6; i++) respond(302, { location: "/loop" });
	await expect(fetchFeed(lease)).rejects.toThrow("Too many redirects");
});
test("bounds the streamed response size", async () => {
	respond(200, {}, "x".repeat(2 * 1024 * 1024 + 1));
	await expect(fetchFeed(lease)).rejects.toThrow("Feed too large");
});
test("rejects non-web ports, empty DNS results and lookup failures before opening a socket", async () => {
	await expect(
		fetchFeed({ ...lease, url: "http://example.com:8080/" }),
	).rejects.toThrow("Non-web port");
	mocks.lookup.mockResolvedValueOnce([]);
	await expect(fetchFeed(lease)).rejects.toThrow("Non-public");
	mocks.lookup.mockRejectedValueOnce(new Error("DNS failed"));
	await expect(fetchFeed(lease)).rejects.toThrow("DNS failed");
	expect(mocks.request).not.toHaveBeenCalled();
});
test("propagates socket errors", async () => {
	mocks.request.mockImplementationOnce(() => {
		const req = new PassThrough();
		return Object.assign(req, {
			end: () => req.emit("error", new Error("Socket failed")),
		});
	});
	await expect(fetchFeed(lease)).rejects.toThrow("Socket failed");
});
