import {
	getExportedNotes,
	getExportedNotesCount,
	getNoteByTitle,
	getUnexportedNotes,
} from "@/application-services/notes/get-notes";
import { getBackendClient } from "@/common/backend/server-client";
import { createBackendClient, ApiHttpError } from "@s-hirano-ist/s-api-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
const note = {
	id: "note",
	title: "Title / 日本語",
	markdown:
		"# Heading\n**bold** [label](https://example.com) ![alt](https://example.com/image)",
	status: "UNEXPORTED",
	createdAt: "2026-10-11T00:00:00Z",
	updatedAt: "2026-10-11T00:00:00Z",
	exportedAt: null,
};
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
test("preserves markdown previews and encodes detail links", async () => {
	const fetch = fixture({ data: [note], totalCount: 1, offset: 0, limit: 24 });
	expect(await getUnexportedNotes(0)).toEqual({
		data: [
			{
				id: "note",
				key: "note",
				title: note.title,
				description: "Heading bold label alt",
				href: `/note/${encodeURIComponent(note.title)}`,
				primaryBadgeText: new Date(note.createdAt).toLocaleDateString("ja-JP"),
			},
		],
		totalCount: 1,
	});
	expect(urlOf(fetch.mock.calls[0][0]).searchParams.get("status")).toBe(
		"UNEXPORTED",
	);
});
test("fetches fresh exported pages and counts", async () => {
	const fetch = fixture({ data: [], totalCount: 0, offset: 24, limit: 24 });
	expect((await getExportedNotes(24)).totalCount).toBe(0);
	fetch.mockResolvedValue(Response.json({ count: 2 }));
	expect(await getExportedNotesCount()).toBe(2);
});
test("looks up encoded titles and returns only the viewer data", async () => {
	const fetch = fixture(note);
	expect(await getNoteByTitle(note.title)).toEqual({
		title: note.title,
		markdown: note.markdown,
	});
	expect(urlOf(fetch.mock.calls[0][0]).pathname).toBe(
		`/api/v1/notes/title/${encodeURIComponent(note.title)}`,
	);
});
test("returns null only for a missing note and propagates service failures", async () => {
	const fetch = fixture({ error: { code: "NOT_FOUND" } }, 404);
	expect(await getNoteByTitle("missing")).toBeNull();
	fetch.mockResolvedValue(
		Response.json({ error: { code: "API_UNAVAILABLE" } }, { status: 503 }),
	);
	await expect(getNoteByTitle("unavailable")).rejects.toBeInstanceOf(
		ApiHttpError,
	);
});

function urlOf(input: RequestInfo | URL) {
	return new URL(input instanceof Request ? input.url : input);
}
