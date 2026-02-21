import {
	makeMarkdown,
	makeNoteTitle,
	noteEntity,
} from "@s-hirano-ist/s-core/notes/entities/note-entity";
import { NoteCreatedEvent } from "@s-hirano-ist/s-core/notes/events/note-created-event";
import type { INotesCommandRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import {
	makeCreatedAt,
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { addNote } from "./add-note";
import { addNoteCore } from "./add-note.core";
import type { AddNoteDeps } from "./add-note.deps";
import { parseAddNoteFormData } from "./helpers/form-data-parser";

vi.mock("@/common/auth/session", () => ({
	getSelfId: vi.fn(),
	hasDumperPostPermission: vi.fn(),
}));

vi.mock("./helpers/form-data-parser", () => ({
	parseAddNoteFormData: vi.fn(),
}));

const mockFormData = new FormData();
mockFormData.append("title", "Example Note");
mockFormData.append("markdown", "This is an example note quote.");

function createMockDeps(
	ensureNoDuplicateImpl: () => Promise<void> = async () => {},
): {
	deps: AddNoteDeps;
	mockCommandRepository: INotesCommandRepository;
	mockEnsureNoDuplicate: ReturnType<typeof vi.fn>;
	mockEventDispatcher: { dispatch: ReturnType<typeof vi.fn> };
} {
	const mockCommandRepository: INotesCommandRepository = {
		create: vi.fn(),
		deleteById: vi.fn(),
	};

	const mockEnsureNoDuplicate = vi
		.fn()
		.mockImplementation(ensureNoDuplicateImpl);

	const mockEventDispatcher = {
		dispatch: vi.fn().mockResolvedValue(undefined),
	};

	const mockDomainServiceFactory = {
		createNotesDomainService: () => ({
			ensureNoDuplicate: mockEnsureNoDuplicate,
		}),
		createArticlesDomainService: vi.fn(),
		createBooksDomainService: vi.fn(),
		createImagesDomainService: vi.fn(),
		createCategoryService: vi.fn(),
	};

	const deps: AddNoteDeps = {
		commandRepository: mockCommandRepository,
		domainServiceFactory:
			mockDomainServiceFactory as unknown as AddNoteDeps["domainServiceFactory"],
		eventDispatcher: mockEventDispatcher,
	};

	return {
		deps,
		mockCommandRepository,
		mockEnsureNoDuplicate,
		mockEventDispatcher,
	};
}

describe("addNoteCore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(parseAddNoteFormData).mockReturnValue({
			title: makeNoteTitle("Example Note"),
			markdown: makeMarkdown("sample markdown"),
			userId: makeUserId("user-123"),
		});
	});

	test("should return success false on Unauthorized", async () => {
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		const { deps } = createMockDeps();

		const result = await addNoteCore(mockFormData, deps);

		expect(result.success).toBe(false);
	});

	test("should create note successfully", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const {
			deps,
			mockCommandRepository,
			mockEnsureNoDuplicate,
			mockEventDispatcher,
		} = createMockDeps();

		const mockNote = {
			title: makeNoteTitle("Example Note"),
			markdown: makeMarkdown("sample markdown"),
			userId: makeUserId("user-123"),
			status: "UNEXPORTED" as const,
			id: makeId("01234567-89ab-7def-9123-456789abcdef"),
			createdAt: makeCreatedAt(),
		};

		const mockEvent = new NoteCreatedEvent({
			title: "Example Note",
			markdown: "sample markdown",
			userId: "user-123",
			caller: "addNote",
		});

		vi.spyOn(noteEntity, "create").mockReturnValue([mockNote, mockEvent]);

		const result = await addNoteCore(mockFormData, deps);

		expect(mockEnsureNoDuplicate).toHaveBeenCalledWith(
			makeNoteTitle("Example Note"),
			makeUserId("user-123"),
		);
		expect(noteEntity.create).toHaveBeenCalled();
		expect(mockCommandRepository.create).toHaveBeenCalledWith(mockNote);
		expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(mockEvent);

		expect(result.success).toBe(true);
		expect(result.message).toBe("inserted");

		vi.mocked(noteEntity.create).mockRestore();
	});

	test("should preserve form data on DuplicateError", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));
		vi.mocked(parseAddNoteFormData).mockReturnValue({
			title: makeNoteTitle("Example Note"),
			markdown: makeMarkdown("This is an example note quote."),
			userId: makeUserId("user-123"),
		});

		const { deps } = createMockDeps(async () => {
			throw new DuplicateError();
		});

		const result = await addNoteCore(mockFormData, deps);

		expect(result.success).toBe(false);
		expect(result.message).toBe("duplicated");
		expect(result.formData).toEqual({
			title: "Example Note",
			markdown: "This is an example note quote.",
		});
	});

	test("should handle unexpected errors", async () => {
		vi.mocked(getSelfId).mockResolvedValue(makeUserId("user-123"));

		const { deps } = createMockDeps(async () => {
			throw new Error("Domain service error");
		});

		const result = await addNoteCore(mockFormData, deps);

		expect(result).toEqual({ success: false, message: "unexpected" });
	});
});

describe("addNote (Server Action)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return forbidden when user doesn't have permission", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(false);

		await expect(addNote(mockFormData)).rejects.toThrow("FORBIDDEN");
	});

	test("should call addNoteCore with default deps when permitted", async () => {
		vi.mocked(hasDumperPostPermission).mockResolvedValue(true);
		vi.mocked(getSelfId).mockRejectedValue(new Error("UNAUTHORIZED"));
		vi.mocked(parseAddNoteFormData).mockReturnValue({
			title: makeNoteTitle("Example Note"),
			markdown: makeMarkdown("sample markdown"),
			userId: makeUserId("user-123"),
		});

		const result = await addNote(mockFormData);

		expect(hasDumperPostPermission).toHaveBeenCalled();
		expect(result.success).toBe(false);
	});
});
