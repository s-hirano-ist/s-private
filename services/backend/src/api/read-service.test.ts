import { Readable } from "node:stream";
import {
	createReadService,
	type ReadServiceDeps,
} from "s-private-backend/api/read-service";
import { describe, expect, test, vi } from "vitest";
function fixture() {
	const database = {
		article: { findMany: vi.fn().mockResolvedValue([]) },
		note: { findMany: vi.fn().mockResolvedValue([]) },
		book: { findMany: vi.fn().mockResolvedValue([]) },
	};
	const mobile = {
		content: { getContent: vi.fn(), lookupContentId: vi.fn() },
		sync: { snapshot: vi.fn() },
	};
	const storage = {
		images: {
			getImage: vi
				.fn()
				.mockResolvedValue(Readable.from([Buffer.from("image")])),
		},
		books: { getImage: vi.fn() },
	};
	const searchVectors = vi.fn().mockResolvedValue({ results: [] });
	const deps = {
		database,
		mobile,
		storage,
		searchVectors,
	} as unknown as ReadServiceDeps;
	return {
		database,
		mobile,
		storage,
		searchVectors,
		service: createReadService(deps),
	};
}
describe("Shared API read service", () => {
	test("returns only owner database fields, never text from the global index", async () => {
		const { database, searchVectors, service } = fixture();
		searchVectors.mockResolvedValue({
			results: [
				{
					content_type: "notes",
					title: "Same title",
					heading_path: ["Same title"],
					text: "another owner's secret",
					doc_id: "file:other",
				},
				{
					content_type: "articles",
					title: "Foreign",
					heading_path: [],
					url: "https://foreign.example",
					text: "secret",
					doc_id: "other",
				},
			],
		});
		database.note.findMany.mockResolvedValue([
			{ id: "owned", title: "Same title", markdown: "Owner's content" },
		]);
		expect(
			await service.search("owner", { query: "query", limit: 20 }),
		).toEqual({
			query: "query",
			data: [
				{
					id: "owned",
					type: "notes",
					title: "Same title",
					snippet: "Owner's content",
				},
			],
		});
		expect(database.note.findMany).toHaveBeenCalledWith({
			where: { userId: "owner", title: { in: ["Same title"] } },
		});
		expect(database.article.findMany.mock.calls[0][0].where.userId).toBe(
			"owner",
		);
	});
	test("never fetches storage for a missing or foreign media record", async () => {
		const { mobile, storage, service } = fixture();
		mobile.content.getContent.mockResolvedValue(null);
		await expect(
			service.media("owner", "images", "foreign", "original"),
		).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
		expect(storage.images.getImage).not.toHaveBeenCalled();
	});
	test("converts DB timestamps and streams thumbnails with their actual content type", async () => {
		const { mobile, service } = fixture();
		mobile.content.getContent.mockResolvedValue({
			id: "image",
			path: "file.jpg",
			contentType: "image/jpeg",
			fileSize: 5,
			width: null,
			height: null,
			status: "UNEXPORTED",
			createdAt: new Date(),
			updatedAt: new Date(),
			exportedAt: null,
		});
		const response = await service.media(
			"owner",
			"images",
			"image",
			"thumbnail",
		);
		expect(response.headers.get("content-type")).toBe("image/webp");
		expect(await response.text()).toBe("image");
	});
	test("wraps category snapshots with the domain discriminator", async () => {
		const { mobile, service } = fixture();
		mobile.sync.snapshot.mockResolvedValue([{ id: "category", name: "Name" }]);
		expect(
			await service.snapshot("owner", {
				domain: "categories",
				after: "",
				limit: 100,
			}),
		).toEqual({
			data: [
				{ domain: "categories", record: { id: "category", name: "Name" } },
			],
			nextAfter: null,
		});
	});
	test("normalizes ISBN in the backend and rejects invalid lookup keys before querying", async () => {
		const { mobile, service } = fixture();
		mobile.content.lookupContentId.mockResolvedValue("book");
		mobile.content.getContent.mockResolvedValue({ id: "book" });
		expect(await service.lookup("books", "owner", "978-0-306-40615-7")).toEqual(
			{ id: "book" },
		);
		expect(mobile.content.lookupContentId).toHaveBeenCalledWith(
			"books",
			"owner",
			"9780306406157",
		);
		await expect(
			service.lookup("books", "owner", "invalid"),
		).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 422 });
		expect(mobile.content.lookupContentId).toHaveBeenCalledTimes(1);
	});
});
