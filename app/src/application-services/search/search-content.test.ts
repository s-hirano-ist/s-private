import { searchContent } from "@/application-services/search/search-content";
import { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { getBackendClient } from "@/common/backend/server-client";
import {
	createBackendClient,
	ApiHttpError,
	ApiProtocolError,
} from "@s-hirano-ist/s-api-client";
import { captureException } from "@sentry/nextjs";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
function fixture(payload: unknown, status = 200) {
	const fetch = vi
		.fn<typeof globalThis.fetch>()
		.mockResolvedValue(Response.json(payload, { status }));
	vi.mocked(getBackendClient).mockResolvedValue(
		createBackendClient({ baseURL: "https://backend.example/api/v1", fetch }),
	);
	return fetch;
}
test("uses generated search and maps owner-scoped hits to encoded viewer links", async () => {
	const fetch = fixture({
		query: "日本語 /",
		data: [
			{
				id: "a",
				type: "articles",
				title: "Article",
				snippet: "owner text",
				url: "https://example.com/a",
				category: { id: "category", name: "Tech" },
			},
			{
				id: "b",
				type: "books",
				title: "Book",
				snippet: "book text",
				isbn: "9780306406157",
				rating: 5,
				tags: ["a,b"],
			},
			{ id: "n", type: "notes", title: "日本語 / #?", snippet: "note text" },
		],
	});
	const result = await searchContent({ query: "日本語 /", limit: 50 });
	expect(result.results).toEqual([
		{
			contentType: "articles",
			title: "Article",
			snippet: "owner text",
			href: "https://example.com/a",
			url: "https://example.com/a",
			category: { id: "category", name: "Tech" },
		},
		{
			contentType: "books",
			title: "Book",
			snippet: "book text",
			href: "9780306406157",
			rating: 5,
			tags: ["a,b"],
		},
		{
			contentType: "notes",
			title: "日本語 / #?",
			snippet: "note text",
			href: encodeURIComponent("日本語 / #?"),
		},
	]);
	const input = urlOf(fetch.mock.calls[0][0]);
	expect(input.pathname).toBe("/api/v1/search");
	expect(input.searchParams.get("query")).toBe("日本語 /");
	expect(input.searchParams.get("limit")).toBe("50");
});
test("preserves empty results and does not cache later searches", async () => {
	const fetch = fixture({ query: "one", data: [] });
	expect(await searchContent({ query: "one" })).toEqual({
		query: "one",
		results: [],
	});
	fetch.mockResolvedValue(Response.json({ query: "two", data: [] }));
	expect((await searchContent({ query: "two" })).query).toBe("two");
	expect(fetch).toHaveBeenCalledTimes(2);
});
test("rejects malformed DTOs and propagates backend errors", async () => {
	const fetch = fixture({
		query: "x",
		data: [{ type: "notes", title: "missing id and snippet" }],
	});
	await expect(searchContent({ query: "x" })).rejects.toBeInstanceOf(
		ApiProtocolError,
	);
	fetch.mockResolvedValue(
		Response.json({ error: { code: "API_UNAVAILABLE" } }, { status: 503 }),
	);
	await expect(searchContent({ query: "x" })).rejects.toBeInstanceOf(
		ApiHttpError,
	);
});
test("server action validates with the generated schema and returns safe errors", async () => {
	fixture({ query: "x", data: [] });
	expect(await searchContentFromClient({ query: "" })).toEqual({
		success: false,
		message: "invalidFormat",
	});
	expect(getBackendClient).not.toHaveBeenCalled();
	expect(
		await searchContentFromClient({ query: "x", limit: 20 }),
	).toMatchObject({ success: true, data: { query: "x", results: [] } });
	vi.mocked(getBackendClient).mockRejectedValue(new Error("internal secret"));
	expect(await searchContentFromClient({ query: "x" })).toEqual({
		success: false,
		message: "unexpected",
	});
	expect(captureException).toHaveBeenCalledOnce();
});

function urlOf(input: RequestInfo | URL) {
	return new URL(input instanceof Request ? input.url : input.toString());
}

test("maps backend query validation failures through the shared API error boundary", async () => {
	fixture({ error: { code: "VALIDATION_ERROR" } }, 422);
	expect(await searchContentFromClient({ query: "valid" })).toEqual({
		success: false,
		message: "invalidFormat",
	});
	expect(captureException).not.toHaveBeenCalled();
});
