import { revalidateTag } from "next/cache";
import { describe, expect, test, vi } from "vitest";
import { parseAddNoteFormData } from "@/application-services/notes/helpers/form-data-parser";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { DuplicateError } from "@/common/error/error-classes";
import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	makeMarkdown,
	makeNoteTitle,
	type Note,
	noteEntity,
} from "@/domains/notes/entities/note-entity";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";
import { addNote } from "./add-note";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock(
	"@/infrastructures/notes/repositories/notes-command-repository",
	() => ({ notesCommandRepository: { create: vi.fn() } }),
);

vi.mock("@/infrastructures/notes/repositories/notes-query-repository", () => ({
	notesQueryRepository: {},
}));

const mockEnsureNoDuplicate = vi.fn();

vi.mock("@/domains/notes/services/notes-domain-service", () => ({
	NotesDomainService: vi.fn().mockImplementation(() => ({
		ensureNoDuplicate: mockEnsureNoDuplicate,
	})),
}));

vi.mock("@/domains/notes/entities/note-entity", async (importOriginal) => {
	const actual = (await importOriginal()) as any;
	return {
		...actual,
		noteEntity: {
			create: vi.fn(),
		},
	};
});

vi.mock("@/application-services/notes/helpers/form-data-parser", () => ({
	parseAddNoteFormData: vi.fn(),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Example Note");
mockFormData.append("markdown", "This is an example note quote.");

describe("addNote", () => {
	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);

		const result = await addNote(mockFormData);
		expect(result.success).toBe(false);
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addNote(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should create note", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		const mockNote = {
			title: "Example Note",
			markdown: "sample markdown",
			userId: "user-123",
			status: "UNEXPORTED",
			id: "01234567-89ab-7def-9123-456789abcdef",
		};

		vi.mocked(parseAddNoteFormData).mockReturnValue({
			title: makeNoteTitle("Example Note"),
			markdown: makeMarkdown("sample markdown"),
			userId: makeUserId("user-123"),
		});
		vi.mocked(noteEntity.create).mockReturnValue(mockNote as Note);
		mockEnsureNoDuplicate.mockResolvedValue(undefined);
		vi.mocked(notesCommandRepository.create).mockResolvedValue();

		const result = await addNote(mockFormData);

		expect(vi.mocked(hasDumperPostPermission)).toHaveBeenCalled();
		expect(vi.mocked(parseAddNoteFormData)).toHaveBeenCalledWith(
			mockFormData,
			"user-123",
		);
		expect(mockEnsureNoDuplicate).toHaveBeenCalled();
		expect(vi.mocked(noteEntity.create)).toHaveBeenCalled();
		expect(notesCommandRepository.create).toHaveBeenCalledWith(mockNote);
		expect(revalidateTag).toHaveBeenCalledWith("notes_UNEXPORTED_user-123");
		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		vi.mocked(parseAddNoteFormData).mockReturnValue({
			title: makeNoteTitle("Example Note"),
			markdown: makeMarkdown("This is an example note quote."),
			userId: makeUserId("user-123"),
		});
		mockEnsureNoDuplicate.mockRejectedValue(new DuplicateError());

		const result = await addNote(mockFormData);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			title: "Example Note",
			markdown: "This is an example note quote.",
		});
	});

	test("should handle errors and return wrapped error", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockResolvedValue("user-123");

		vi.mocked(parseAddNoteFormData).mockReturnValue({
			title: makeNoteTitle("Example Note"),
			markdown: makeMarkdown("This is an example note quote."),
			userId: makeUserId("user-123"),
		});

		const error = new Error("Domain service error");
		mockEnsureNoDuplicate.mockRejectedValue(error);

		const result = await addNote(mockFormData);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});
