import { beforeEach, describe, expect, test, vi } from "vitest";
const articleFindMany = vi.hoisted(() => vi.fn());
const articleCount = vi.hoisted(() => vi.fn());
const noteFindFirst = vi.hoisted(() => vi.fn());
vi.mock("@/prisma", () => ({
	default: {
		article: { findMany: articleFindMany, count: articleCount },
		note: { findFirst: noteFindFirst },
	},
}));
import { getMobileContent, listMobileContent, listSchema } from "./content";

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
});
