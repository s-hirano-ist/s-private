import {
	getCategories,
	getExportedArticles,
	getExportedArticlesCount,
	getUnexportedArticles,
} from "@/application-services/articles/get-articles";
import { getBackendClient } from "@/common/backend/server-client";
import {
	createBackendClient,
	ApiProtocolError,
} from "@s-hirano-ist/s-api-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
const article = {
	id: "article",
	title: "Article",
	url: "https://example.com/story",
	quote: "Quote",
	categoryId: "category",
	categoryName: "Tech",
	ogTitle: "OG title",
	ogDescription: "OG description",
	status: "UNEXPORTED",
	createdAt: "2026-10-11T00:00:00Z",
	updatedAt: "2026-10-11T00:00:00Z",
	exportedAt: null,
};
beforeEach(() => vi.clearAllMocks());
function fixture(payload: unknown) {
	const fetch = vi
		.fn<typeof globalThis.fetch>()
		.mockResolvedValue(Response.json(payload));
	vi.mocked(getBackendClient).mockResolvedValue(
		createBackendClient({ baseURL: "https://backend.example/api/v1", fetch }),
	);
	return fetch;
}
test("preserves article cards while sending pagination and status through the generated client", async () => {
	const fetch = fixture({
		data: [article],
		totalCount: 50,
		offset: 24,
		limit: 24,
	});
	const page = await getUnexportedArticles(24);
	expect(page).toEqual({
		data: [
			{
				id: "article",
				key: "article",
				title: "Article",
				href: article.url,
				description: "Quote\nOG title\nOG description",
				primaryBadgeText: "Tech",
				secondaryBadgeText: "example.com",
			},
		],
		totalCount: 50,
	});
	const url = urlOf(fetch.mock.calls[0][0]);
	expect(url.pathname).toBe("/api/v1/articles");
	expect(Object.fromEntries(url.searchParams)).toEqual({
		status: "UNEXPORTED",
		offset: "24",
		limit: "24",
	});
	expect(fetch.mock.calls[0][1]?.cache).toBe("no-store");
});
test("does not reuse a persistent page after backend data changes", async () => {
	const fetch = fixture({ data: [], totalCount: 0, offset: 0, limit: 24 });
	expect((await getExportedArticles(0)).totalCount).toBe(0);
	fetch.mockResolvedValue(
		Response.json({ data: [article], totalCount: 1, offset: 0, limit: 24 }),
	);
	expect((await getExportedArticles(0)).totalCount).toBe(1);
	expect(fetch).toHaveBeenCalledTimes(2);
});
test("loads counts and categories through their typed endpoints", async () => {
	const fetch = fixture({ count: 17 });
	expect(await getExportedArticlesCount()).toBe(17);
	fetch.mockResolvedValue(
		Response.json({ data: [{ id: "category", name: "Tech" }] }),
	);
	expect(await getCategories()).toEqual([{ id: "category", name: "Tech" }]);
});
test("rejects malformed page DTOs before producing cards", async () => {
	fixture({
		data: [{ id: "article", userId: "internal" }],
		totalCount: 1,
		offset: 0,
		limit: 24,
	});
	await expect(getUnexportedArticles(0)).rejects.toBeInstanceOf(
		ApiProtocolError,
	);
});

test("keeps optional categories available as an empty list when the backend is temporarily unavailable", async () => {
	const fetch = fixture({ data: [] });
	fetch.mockResolvedValue(
		Response.json({ error: { code: "API_UNAVAILABLE" } }, { status: 503 }),
	);
	expect(await getCategories()).toEqual([]);
});

function urlOf(input: RequestInfo | URL) {
	return new URL(input instanceof Request ? input.url : input);
}
