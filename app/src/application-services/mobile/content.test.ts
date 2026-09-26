import { beforeEach, describe, expect, test, vi } from "vitest";
const articleFindMany = vi.hoisted(() => vi.fn());
const articleCount = vi.hoisted(() => vi.fn());
const noteFindFirst = vi.hoisted(() => vi.fn());
const manifestFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const imageFindMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock("@/prisma", () => ({
	default: {
		article: { findMany: articleFindMany, count: articleCount },
		note: { findFirst: noteFindFirst, findMany: manifestFindMany },
		book: { findMany: manifestFindMany },
		image: { findMany: imageFindMany },
		category: { findMany: manifestFindMany },
	},
}));
import {
	getMobileContent,
	listMobileContent,
	listMobileManifest,
	listSchema,
} from "./content";

describe("mobile content owner scope", () => {
	beforeEach(() => vi.clearAllMocks());

	test("uses owner and status filters for paginated articles", async () => {
		articleFindMany.mockResolvedValue([]);
		articleCount.mockResolvedValue(0);
		const query = listSchema.parse({
			offset: "20",
			limit: "10",
			status: "EXPORTED",
		});
		await expect(
			listMobileContent("articles", "owner-1", query),
		).resolves.toMatchObject({ data: [], totalCount: 0 });
		expect(articleFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "owner-1", status: "EXPORTED" },
				skip: 20,
				take: 10,
			}),
		);
		expect(articleCount).toHaveBeenCalledWith({
			where: { userId: "owner-1", status: "EXPORTED" },
		});
	});

	test("returns 404 for an ID not owned by the requester", async () => {
		noteFindFirst.mockResolvedValue(null);
		await expect(
			getMobileContent("notes", "owner-1", "foreign-id"),
		).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
		expect(noteFindFirst).toHaveBeenCalledWith({
			where: { id: "foreign-id", userId: "owner-1" },
		});
	});

	test("limits page size", () => {
		expect(() => listSchema.parse({ limit: "101" })).toThrow(/too_big/u);
	});

	test("manifest reads every domain and category within the owner scope", async () => {
		articleFindMany.mockResolvedValue([]);
		await listMobileManifest("owner-1");
		expect(articleFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "owner-1" },
				select: { id: true, updatedAt: true },
			}),
		);
		expect(manifestFindMany).toHaveBeenCalledTimes(3);
		for (const call of manifestFindMany.mock.calls) {
			expect(call[0].where).toEqual({ userId: "owner-1" });
		}
		expect(imageFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "owner-1" },
				select: expect.objectContaining({
					id: true,
					status: true,
					path: true,
					updatedAt: true,
				}),
			}),
		);
	});
});
