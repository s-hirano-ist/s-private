import { beforeEach, describe, expect, test, vi } from "vitest";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";
import {
	getContentByTitle,
	getExportedContents,
	getExportedContentsCount,
	getUnexportedContents,
	getUnexportedContentsCount,
} from "./get-contents";

vi.mock(
	"@/infrastructures/contents/repositories/contents-query-repository",
	() => ({
		contentsQueryRepository: {
			findMany: vi.fn(),
			count: vi.fn(),
			findByTitle: vi.fn(),
		},
	}),
);

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("test-user-id"),
}));

describe("get-contents", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllContents", () => {
		test("should fetch and transform contents correctly", async () => {
			const mockContents = [
				{
					id: "1",
					key: "1",
					title: "Test Content 1",
				},
				{
					id: "2",
					key: "2",
					title: "Test Content 2",
				},
			];

			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue(
				mockContents,
			);
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(50);

			const result = await getExportedContents(0);

			expect(contentsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				expect.objectContaining({
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid_contents_0"] },
				}),
			);

			expect(result).toEqual({
				data: [
					{
						id: "1",
						key: "1",
						title: "Test Content 1",
						description: "",
						href: "/content/Test%20Content%201",
					},
					{
						id: "2",
						key: "2",
						title: "Test Content 2",
						description: "",
						href: "/content/Test%20Content%202",
					},
				],
				totalCount: 50,
			});
		});

		test("should handle empty results", async () => {
			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedContents(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors", async () => {
			vi.mocked(contentsQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedContents(0)).rejects.toThrow("Database error");
		});

		test("should handle contents with null images", async () => {
			const mockContents = [
				{
					id: "",
					key: "1",
					title: "Test Content",
				},
			];

			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue(
				mockContents,
			);
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(1);

			const result = await getExportedContents(0);

			expect(result).toEqual({
				data: [
					{
						id: "",
						key: "",
						title: "Test Content",
						description: "",
						href: "/content/Test%20Content",
					},
				],
				totalCount: 1,
			});
		});

		test("should use title as href for contents", async () => {
			const mockContents = [
				{
					id: "",
					key: "1",
					title: "My Special Content Title",
				},
			];

			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue(
				mockContents,
			);
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(1);

			const result = await getExportedContents(0);

			expect(result.data[0].href).toBe(
				"/content/My%20Special%20Content%20Title",
			);
			expect(result.data[0].title).toBe("My Special Content Title");
		});
	});

	describe("getExportedContentsCount", () => {
		test("should return count of exported contents", async () => {
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(25);

			const result = await getExportedContentsCount();

			expect(contentsQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toEqual(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedContentsCount();

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(contentsQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedContentsCount()).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("getUnexportedContentsCount", () => {
		test("should return count of unexported contents", async () => {
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(15);

			const result = await getUnexportedContentsCount();

			expect(contentsQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
			);
			expect(result).toEqual(15);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(0);

			const result = await getUnexportedContentsCount();

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(contentsQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedContentsCount()).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("getUnexportedContents", () => {
		test("should fetch and transform unexported contents correctly", async () => {
			const mockContents = [
				{
					id: "3",
					key: "3",
					title: "Unexported Content 1",
				},
				{
					id: "4",
					key: "4",
					title: "Unexported Content 2",
				},
			];

			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue(
				mockContents,
			);
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(30);

			const result = await getUnexportedContents(0);

			expect(contentsQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
				expect.objectContaining({
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
				}),
			);

			expect(result).toEqual({
				data: [
					{
						id: "3",
						key: "3",
						title: "Unexported Content 1",
						description: "",
						href: "/content/Unexported%20Content%201",
					},
					{
						id: "4",
						key: "4",
						title: "Unexported Content 2",
						description: "",
						href: "/content/Unexported%20Content%202",
					},
				],
				totalCount: 30,
			});
		});

		test("should handle empty unexported results", async () => {
			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(0);

			const result = await getUnexportedContents(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors for unexported contents", async () => {
			vi.mocked(contentsQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedContents(0)).rejects.toThrow("Database error");
		});

		test("should encode special characters in href for unexported", async () => {
			const mockContents = [
				{
					id: "5",
					key: "5",
					title: "Content with & Special Characters!",
				},
			];

			vi.mocked(contentsQueryRepository.findMany).mockResolvedValue(
				mockContents,
			);
			vi.mocked(contentsQueryRepository.count).mockResolvedValue(1);

			const result = await getUnexportedContents(0);

			expect(result.data[0].href).toBe(
				"/content/Content%20with%20%26%20Special%20Characters!",
			);
		});
	});

	describe("getContentByTitle", () => {
		test("should fetch content by title successfully", async () => {
			const mockContent = "# Test Content\n\nThis is some test content.";

			vi.mocked(contentsQueryRepository.findByTitle).mockResolvedValue(
				mockContent,
			);

			const result = await getContentByTitle("Test Content");

			expect(contentsQueryRepository.findByTitle).toHaveBeenCalledWith(
				"Test Content",
				"test-user-id",
			);
			expect(result).toBe(mockContent);
		});

		test("should return null when content not found", async () => {
			vi.mocked(contentsQueryRepository.findByTitle).mockResolvedValue(null);

			const result = await getContentByTitle("Non-existent Content");

			expect(contentsQueryRepository.findByTitle).toHaveBeenCalledWith(
				"Non-existent Content",
				"test-user-id",
			);
			expect(result).toBeNull();
		});

		test("should handle database errors for content lookup", async () => {
			vi.mocked(contentsQueryRepository.findByTitle).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getContentByTitle("Test Content")).rejects.toThrow(
				"Database error",
			);
		});

		test("should handle special characters in title", async () => {
			const mockContent = "# Special Content";
			const specialTitle = "Content with & Special Characters!";

			vi.mocked(contentsQueryRepository.findByTitle).mockResolvedValue(
				mockContent,
			);

			const result = await getContentByTitle(specialTitle);

			expect(contentsQueryRepository.findByTitle).toHaveBeenCalledWith(
				specialTitle,
				"test-user-id",
			);
			expect(result).toBe(mockContent);
		});
	});
});
