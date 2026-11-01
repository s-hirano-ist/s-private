import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import {
	createReadQueries,
	type ReadQueriesDeps,
} from "@s-hirano-ist/s-application/content/queries";
import { createMediaReader } from "@s-hirano-ist/s-infrastructure/content/media-reader";
import { createContentQueryRepository } from "@s-hirano-ist/s-infrastructure/content/query-repository";
import { createSearchIndex } from "@s-hirano-ist/s-infrastructure/search/search-index";
import { Readable } from "node:stream";
import { createReadService } from "s-private-backend/api/read-service";
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
		content: mobile.content,
		sync: mobile.sync,
		query: createContentQueryRepository(database as unknown as DatabaseClient),
		search: createSearchIndex(searchVectors),
		media: {
			images: createMediaReader(storage.images),
			books: createMediaReader(storage.books),
		},
	} as unknown as ReadQueriesDeps;
	return {
		database,
		mobile,
		storage,
		searchVectors,
		service: createReadService(createReadQueries(deps)),
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
		).rejects.toMatchObject({ code: "NOT_FOUND" });
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
		mobile.content.getContent.mockResolvedValue({
			id: "book",
			status: "UNEXPORTED",
			createdAt: new Date(),
			updatedAt: new Date(),
			exportedAt: null,
			isbn: "9780306406157",
			title: "Book",
			markdown: null,
			imagePath: null,
			rating: 3,
			tags: [],
		});
		expect(
			await service.lookup("books", "owner", "978-0-306-40615-7"),
		).toMatchObject({ id: "book" });
		expect(mobile.content.lookupContentId).toHaveBeenCalledWith(
			"books",
			"owner",
			"9780306406157",
		);
		await expect(
			service.lookup("books", "owner", "invalid"),
		).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
		expect(mobile.content.lookupContentId).toHaveBeenCalledTimes(1);
	});
});

test("cancelling media closes the storage stream even before its first chunk", async () => {
	const { mobile, storage, service } = fixture();
	mobile.content.getContent.mockResolvedValue({
		id: "image",
		path: "file.jpg",
		contentType: "image/jpeg",
		status: "UNEXPORTED",
		createdAt: new Date(),
		updatedAt: new Date(),
		exportedAt: null,
		fileSize: 5,
		width: null,
		height: null,
	});
	const response = await service.media("owner", "images", "image", "original");
	const stream = await storage.images.getImage.mock.results[0].value;
	await response.body?.cancel();
	expect(stream.destroyed).toBe(true);
});
