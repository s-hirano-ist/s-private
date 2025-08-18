import { beforeEach, describe, expect, test, vi } from "vitest";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";
import {
	getExportedNotes,
	getExportedNotesCount,
	getNoteByTitle,
	getUnexportedNotes,
	getUnexportedNotesCount,
} from "./get-notes";

vi.mock("@/infrastructures/notes/repositories/notes-query-repository", () => ({
	notesQueryRepository: {
		findMany: vi.fn(),
		count: vi.fn(),
		findByTitle: vi.fn(),
	},
}));

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn().mockResolvedValue("test-user-id"),
}));

describe("get-notes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAllNotes", () => {
		test("should fetch and transform notes correctly", async () => {
			const mockNotes = [
				{
					id: "1",
					key: "1",
					title: "Test Note 1",
				},
				{
					id: "2",
					key: "2",
					title: "Test Note 2",
				},
			];

			vi.mocked(notesQueryRepository.findMany).mockResolvedValue(mockNotes);
			vi.mocked(notesQueryRepository.count).mockResolvedValue(50);

			const result = await getExportedNotes(0);

			expect(notesQueryRepository.findMany).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
				expect.objectContaining({
					skip: 0,
					take: 24,
					orderBy: { createdAt: "desc" },
					cacheStrategy: { ttl: 400, swr: 40, tags: ["testuserid_notes_0"] },
				}),
			);

			expect(result).toEqual({
				data: [
					{
						id: "1",
						key: "1",
						title: "Test Note 1",
						description: "",
						href: "/note/Test%20Note%201",
					},
					{
						id: "2",
						key: "2",
						title: "Test Note 2",
						description: "",
						href: "/note/Test%20Note%202",
					},
				],
				totalCount: 50,
			});
		});

		test("should handle empty results", async () => {
			vi.mocked(notesQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(notesQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedNotes(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors", async () => {
			vi.mocked(notesQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedNotes(0)).rejects.toThrow("Database error");
		});

		test("should handle notes with null images", async () => {
			const mockNotes = [
				{
					id: "",
					key: "1",
					title: "Test Note",
				},
			];

			vi.mocked(notesQueryRepository.findMany).mockResolvedValue(mockNotes);
			vi.mocked(notesQueryRepository.count).mockResolvedValue(1);

			const result = await getExportedNotes(0);

			expect(result).toEqual({
				data: [
					{
						id: "",
						key: "",
						title: "Test Note",
						description: "",
						href: "/note/Test%20Note",
					},
				],
				totalCount: 1,
			});
		});

		test("should use title as href for notes", async () => {
			const mockNotes = [
				{
					id: "",
					key: "1",
					title: "My Special Note Title",
				},
			];

			vi.mocked(notesQueryRepository.findMany).mockResolvedValue(mockNotes);
			vi.mocked(notesQueryRepository.count).mockResolvedValue(1);

			const result = await getExportedNotes(0);

			expect(result.data[0].href).toBe("/note/My%20Special%20Note%20Title");
			expect(result.data[0].title).toBe("My Special Note Title");
		});
	});

	describe("getExportedNotesCount", () => {
		test("should return count of exported notes", async () => {
			vi.mocked(notesQueryRepository.count).mockResolvedValue(25);

			const result = await getExportedNotesCount();

			expect(notesQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"EXPORTED",
			);
			expect(result).toEqual(25);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(notesQueryRepository.count).mockResolvedValue(0);

			const result = await getExportedNotesCount();

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(notesQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getExportedNotesCount()).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedNotesCount", () => {
		test("should return count of unexported notes", async () => {
			vi.mocked(notesQueryRepository.count).mockResolvedValue(15);

			const result = await getUnexportedNotesCount();

			expect(notesQueryRepository.count).toHaveBeenCalledWith(
				"test-user-id",
				"UNEXPORTED",
			);
			expect(result).toEqual(15);
		});

		test("should return 0 for empty collection", async () => {
			vi.mocked(notesQueryRepository.count).mockResolvedValue(0);

			const result = await getUnexportedNotesCount();

			expect(result).toEqual(0);
		});

		test("should handle database errors", async () => {
			vi.mocked(notesQueryRepository.count).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedNotesCount()).rejects.toThrow("Database error");
		});
	});

	describe("getUnexportedNotes", () => {
		test("should fetch and transform unexported notes correctly", async () => {
			const mockNotes = [
				{
					id: "3",
					key: "3",
					title: "Unexported Note 1",
				},
				{
					id: "4",
					key: "4",
					title: "Unexported Note 2",
				},
			];

			vi.mocked(notesQueryRepository.findMany).mockResolvedValue(mockNotes);
			vi.mocked(notesQueryRepository.count).mockResolvedValue(30);

			const result = await getUnexportedNotes(0);

			expect(notesQueryRepository.findMany).toHaveBeenCalledWith(
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
						title: "Unexported Note 1",
						description: "",
						href: "/note/Unexported%20Note%201",
					},
					{
						id: "4",
						key: "4",
						title: "Unexported Note 2",
						description: "",
						href: "/note/Unexported%20Note%202",
					},
				],
				totalCount: 30,
			});
		});

		test("should handle empty unexported results", async () => {
			vi.mocked(notesQueryRepository.findMany).mockResolvedValue([]);
			vi.mocked(notesQueryRepository.count).mockResolvedValue(0);

			const result = await getUnexportedNotes(0);

			expect(result).toEqual({
				data: [],
				totalCount: 0,
			});
		});

		test("should handle database errors for unexported notes", async () => {
			vi.mocked(notesQueryRepository.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getUnexportedNotes(0)).rejects.toThrow("Database error");
		});

		test("should encode special characters in href for unexported", async () => {
			const mockNotes = [
				{
					id: "5",
					key: "5",
					title: "Note with & Special Characters!",
				},
			];

			vi.mocked(notesQueryRepository.findMany).mockResolvedValue(mockNotes);
			vi.mocked(notesQueryRepository.count).mockResolvedValue(1);

			const result = await getUnexportedNotes(0);

			expect(result.data[0].href).toBe(
				"/note/Note%20with%20%26%20Special%20Characters!",
			);
		});
	});

	describe("getNoteByTitle", () => {
		test("should fetch note by title successfully", async () => {
			const mockNote = {
				id: "1",
				title: "Test Note",
				markdown: "# Test Note\n\nThis is some test note.",
			};

			vi.mocked(notesQueryRepository.findByTitle).mockResolvedValue(mockNote);

			const result = await getNoteByTitle("Test Note");

			expect(notesQueryRepository.findByTitle).toHaveBeenCalledWith(
				"Test Note",
				"test-user-id",
			);
			expect(result).toBe(mockNote);
		});

		test("should return null when note not found", async () => {
			vi.mocked(notesQueryRepository.findByTitle).mockResolvedValue(null);

			const result = await getNoteByTitle("Non-existent Note");

			expect(notesQueryRepository.findByTitle).toHaveBeenCalledWith(
				"Non-existent Note",
				"test-user-id",
			);
			expect(result).toBeNull();
		});

		test("should handle database errors for note lookup", async () => {
			vi.mocked(notesQueryRepository.findByTitle).mockRejectedValue(
				new Error("Database error"),
			);

			await expect(getNoteByTitle("Test Note")).rejects.toThrow(
				"Database error",
			);
		});

		test("should handle special characters in title", async () => {
			const specialTitle = "Note with & Special Characters!";
			const mockNote = {
				id: "2",
				title: specialTitle,
				markdown: "# Special Note",
			};

			vi.mocked(notesQueryRepository.findByTitle).mockResolvedValue(mockNote);

			const result = await getNoteByTitle(specialTitle);

			expect(notesQueryRepository.findByTitle).toHaveBeenCalledWith(
				specialTitle,
				"test-user-id",
			);
			expect(result).toBe(mockNote);
		});
	});
});
