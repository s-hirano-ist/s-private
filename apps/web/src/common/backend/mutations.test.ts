import { addArticle } from "@/application-services/articles/add-article";
import { deleteArticle } from "@/application-services/articles/delete-article";
import { deleteBooks } from "@/application-services/books/delete-books";
import { deleteImage } from "@/application-services/images/delete-image";
import { addNote } from "@/application-services/notes/add-note";
import { deleteNote } from "@/application-services/notes/delete-note";
import { getBackendClient } from "@/common/backend/server-client";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
const authBoundary = new Error("NEXT_UNAUTHORIZED");
vi.mock("next/navigation", () => ({
	unstable_rethrow: (error: unknown) => {
		if (error instanceof Error && error === authBoundary) throw error;
	},
}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
const operationId = "01933f5c-9df0-7001-9123-456789abcdef";
beforeEach(() => vi.clearAllMocks());
function form(fields: Record<string, string>) {
	const data = new FormData();
	for (const [key, value] of Object.entries({ operationId, ...fields }))
		data.set(key, value);
	return data;
}
function fixture(payload: unknown, status = 201) {
	const fetch = vi
		.fn<typeof globalThis.fetch>()
		.mockResolvedValue(Response.json(payload, { status }));
	vi.mocked(getBackendClient).mockResolvedValue(
		createBackendClient({ baseURL: "https://backend.example/api/v1", fetch }),
	);
	return fetch;
}
test("sends article and note DTOs with the supplied operation ID", async () => {
	const fetch = fixture({
		accepted: true,
		operationId,
		resource: { id: "article", type: "articles" },
	});
	expect(
		await addArticle(
			form({
				title: "Title",
				quote: "Quote",
				category: "Tech",
				url: "https://example.com",
			}),
		),
	).toEqual({ success: true, message: "inserted" });
	expect(fetch.mock.calls[0][1]).toMatchObject({
		method: "POST",
		body: JSON.stringify({
			operationId,
			title: "Title",
			url: "https://example.com",
			category: "Tech",
			quote: "Quote",
		}),
	});
	fetch.mockResolvedValue(
		Response.json(
			{ accepted: true, operationId, resource: { id: "note", type: "notes" } },
			{ status: 201 },
		),
	);
	expect(
		await addNote(form({ title: "Note", markdown: "# Original" })),
	).toEqual({ success: true, message: "inserted" });
	expect(fetch.mock.calls[1][1]?.body).toBe(
		JSON.stringify({ operationId, title: "Note", markdown: "# Original" }),
	);
});
test("preserves form fields and operation ID for duplicate or invalid input", async () => {
	const fetch = fixture({ error: { code: "DUPLICATE" } }, 409);
	const data = form({ title: "Note", markdown: "Text" });
	expect(await addNote(data)).toEqual({
		success: false,
		message: "duplicated",
		formData: { operationId, title: "Note", markdown: "Text" },
	});
	expect(await addNote(form({ title: "", markdown: "Text" }))).toMatchObject({
		success: false,
		message: "invalidFormat",
	});
	expect(fetch).toHaveBeenCalledTimes(1);
});
test.each([
	["articles", deleteArticle],
	["notes", deleteNote],
	["images", deleteImage],
	["books", deleteBooks],
])(
	"deletes %s via the common API and preserves state conflicts",
	async (domain, action) => {
		const fetch = fixture({ error: { code: "NOT_DELETABLE" } }, 409);
		expect(await action("record")).toEqual({
			success: false,
			message: "notAllowed",
		});
		fetch.mockResolvedValue(new Response(null, { status: 204 }));
		expect(await action("record")).toEqual({
			success: true,
			message: "deleted",
		});
		expect(urlOf(fetch.mock.calls[1][0]).href).toBe(
			`https://backend.example/api/v1/${domain}/record`,
		);
	},
);
test("rethrows the framework authentication boundary and does not expose internal failures", async () => {
	vi.mocked(getBackendClient).mockRejectedValue(authBoundary);
	await expect(deleteArticle("record")).rejects.toBe(authBoundary);
	vi.mocked(getBackendClient).mockRejectedValue(
		new Error("private database details"),
	);
	expect(await deleteNote("record")).toEqual({
		success: false,
		message: "unexpected",
	});
});

function urlOf(input: RequestInfo | URL) {
	return new URL(input instanceof Request ? input.url : input.toString());
}
