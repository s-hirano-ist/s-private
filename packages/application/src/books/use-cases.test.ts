import {
	createBook,
	deleteBook,
	type CreateBookDeps,
} from "@s-hirano-ist/s-application/books/use-cases";
import { StoragePhaseError } from "@s-hirano-ist/s-application/diagnostics/storage-phase-error";
import {
	makeISBN,
	makeBookTitle,
	makeRating,
	makeTags,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import {
	makeId,
	makeUserId,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import {
	makePath,
	makeContentType,
	makeFileSize,
} from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { expect, test, vi } from "vite-plus/test";

const input = {
	isbn: makeISBN("9781234567890"),
	title: makeBookTitle("Book"),
	rating: makeRating(3),
	tags: makeTags(["Tech"]),
	imagePath: makePath("cover.png", true),
	userId: makeUserId("owner"),
	path: makePath("cover.png", true),
	contentType: makeContentType("image/png"),
	fileSize: makeFileSize(3),
	originalBuffer: Buffer.from("png"),
	thumbnailBuffer: Buffer.from("thumbnail"),
};
function fixture() {
	const ensureNoDuplicate = vi.fn().mockResolvedValue(undefined);
	const create = vi
		.fn<CreateBookDeps["commandRepository"]["create"]>()
		.mockResolvedValue(undefined);
	const deleteById = vi
		.fn<CreateBookDeps["commandRepository"]["deleteById"]>()
		.mockResolvedValue({ title: input.title });
	const dispatch = vi
		.fn<CreateBookDeps["eventDispatcher"]["dispatch"]>()
		.mockResolvedValue(undefined);
	const uploadImage = vi
		.fn<CreateBookDeps["storageService"]["uploadImage"]>()
		.mockResolvedValue(undefined);
	const deps: CreateBookDeps = {
		commandRepository: { create, deleteById },
		eventDispatcher: { dispatch },
		domainServiceFactory: {
			createBooksDomainService: () => ({ ensureNoDuplicate }),
		},
		storageService: {
			uploadImage,
			getImage: vi.fn(),
			getImageOrThrow: vi.fn(),
			deleteImage: vi.fn(),
		},
	};
	return { deps, ensureNoDuplicate, create, deleteById, dispatch, uploadImage };
}
test("persists the owner only after both objects have been stored", async () => {
	const f = fixture();
	await createBook(input, f.deps, { action: "addBooks" });
	expect(f.ensureNoDuplicate).toHaveBeenCalledWith(input.isbn, input.userId);
	expect(f.uploadImage.mock.calls).toEqual([
		[input.path, input.originalBuffer, false],
		[input.path, input.thumbnailBuffer, true],
	]);
	expect(f.create).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({
			userId: input.userId,
			imagePath: input.imagePath,
		}),
	);
	expect(f.create.mock.invocationCallOrder[0]).toBeGreaterThan(
		f.uploadImage.mock.invocationCallOrder[1],
	);
	expect(f.dispatch).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({
			metadata: expect.objectContaining({ userId: input.userId }),
		}),
	);
});
test("rejects duplicates before writing any object, record or event", async () => {
	const f = fixture();
	f.ensureNoDuplicate.mockRejectedValue(new DuplicateError());
	await expect(
		createBook(input, f.deps, { action: "addBooks" }),
	).rejects.toBeInstanceOf(DuplicateError);
	expect(f.uploadImage).not.toHaveBeenCalled();
	expect(f.create).not.toHaveBeenCalled();
	expect(f.dispatch).not.toHaveBeenCalled();
});
test.each([
	["upload-original", 0],
	["upload-thumbnail", 1],
] as const)(
	"does not persist or publish after %s failure",
	async (phase, successfulUploads) => {
		const f = fixture();
		Array.from({ length: successfulUploads }, () =>
			f.uploadImage.mockResolvedValueOnce(undefined),
		);
		f.uploadImage.mockRejectedValueOnce(new Error("storage unavailable"));
		await expect(
			createBook(input, f.deps, { action: "addBooks" }),
		).rejects.toMatchObject({
			name: StoragePhaseError.name,
			context: expect.objectContaining({ phase }),
		});
		expect(f.create).not.toHaveBeenCalled();
		expect(f.dispatch).not.toHaveBeenCalled();
	},
);
test("deletes only the owner's unexported record and does not publish a refused deletion", async () => {
	const f = fixture();
	const id = makeId();
	f.deleteById.mockRejectedValueOnce(new Error("not deletable"));
	await expect(deleteBook(id, input.userId, f.deps)).rejects.toThrow(
		"not deletable",
	);
	expect(f.dispatch).not.toHaveBeenCalled();
	await deleteBook(id, input.userId, f.deps);
	expect(f.deleteById).toHaveBeenCalledWith(
		id,
		input.userId,
		makeUnexportedStatus(),
	);
	expect(f.dispatch).toHaveBeenCalledOnce();
});
