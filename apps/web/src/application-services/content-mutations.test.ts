import { addArticle } from "@/application-services/articles/add-article";
import { deleteArticle } from "@/application-services/articles/delete-article";
import { deleteBooks } from "@/application-services/books/delete-books";
import { deleteImage } from "@/application-services/images/delete-image";
import { addNote } from "@/application-services/notes/add-note";
import { deleteNote } from "@/application-services/notes/delete-note";
import { getBackendClient } from "@/common/backend/server-client";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
import { refresh, updateTag } from "next/cache";
import { beforeEach, expect, test, vi } from "vite-plus/test";

vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
const operationId = "01933f5c-9df0-7001-9123-456789abcdef";
function createForm() {
	const data = new FormData();
	for (const [key, value] of Object.entries({
		operationId,
		title: "Cache test",
		url: "https://example.com",
		category: "Tech",
		markdown: "Content",
	}))
		data.set(key, value);
	return data;
}
const mutations = [
	{
		name: "add article",
		domain: "articles",
		run: () => addArticle(createForm()),
		create: true,
	},
	{
		name: "add note",
		domain: "notes",
		run: () => addNote(createForm()),
		create: true,
	},
	{
		name: "delete article",
		domain: "articles",
		run: () => deleteArticle("id"),
	},
	{ name: "delete note", domain: "notes", run: () => deleteNote("id") },
	{ name: "delete image", domain: "images", run: () => deleteImage("id") },
	{ name: "delete book", domain: "books", run: () => deleteBooks("id") },
];
function successResponse(mutation: (typeof mutations)[number]) {
	return mutation.create
		? Response.json(
				{
					accepted: true,
					operationId,
					resource: { id: "id", type: mutation.domain },
				},
				{ status: 201 },
			)
		: new Response(null, { status: 204 });
}
for (const mutation of mutations) {
	test(`${mutation.name} invalidates only after a successful backend write`, async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(successResponse(mutation));
		vi.mocked(getBackendClient).mockResolvedValue(
			createBackendClient({ baseURL: "https://backend.example/api/v1", fetch }),
		);
		expect((await mutation.run()).success).toBe(true);
		expect(updateTag).toHaveBeenCalledExactlyOnceWith(
			`content:${mutation.domain}`,
		);
		expect(refresh).toHaveBeenCalledOnce();
		expect(fetch.mock.invocationCallOrder[0]).toBeLessThan(
			vi.mocked(updateTag).mock.invocationCallOrder[0],
		);
	});
	test(`${mutation.name} preserves cache when backend rejects the write`, async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(
				Response.json({ error: { code: "API_UNAVAILABLE" } }, { status: 503 }),
			);
		vi.mocked(getBackendClient).mockResolvedValue(
			createBackendClient({ baseURL: "https://backend.example/api/v1", fetch }),
		);
		expect((await mutation.run()).success).toBe(false);
		expect(updateTag).not.toHaveBeenCalled();
		expect(refresh).not.toHaveBeenCalled();
	});
}
