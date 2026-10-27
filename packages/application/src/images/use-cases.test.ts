import { StoragePhaseError } from "@s-hirano-ist/s-application/diagnostics/storage-phase-error";
import {
	createImage,
	deleteImage,
	type CreateImageDeps,
} from "@s-hirano-ist/s-application/images/use-cases";
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
		.fn<CreateImageDeps["commandRepository"]["create"]>()
		.mockResolvedValue(undefined);
	const deleteById = vi
		.fn<CreateImageDeps["commandRepository"]["deleteById"]>()
		.mockResolvedValue({ path: input.path });
	const dispatch = vi
		.fn<CreateImageDeps["eventDispatcher"]["dispatch"]>()
		.mockResolvedValue(undefined);
	const uploadImage = vi
		.fn<CreateImageDeps["storageService"]["uploadImage"]>()
		.mockResolvedValue(undefined);
	const deps: CreateImageDeps = {
		commandRepository: { create, deleteById },
		eventDispatcher: { dispatch },
		domainServiceFactory: {
			createImagesDomainService: () => ({ ensureNoDuplicate }),
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
	await createImage(input, f.deps, { action: "addImage" });
	expect(f.ensureNoDuplicate).toHaveBeenCalledWith(input.path, input.userId);
	expect(f.uploadImage.mock.calls).toEqual([
		[input.path, input.originalBuffer, false],
		[input.path, input.thumbnailBuffer, true],
	]);
	expect(f.create).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ userId: input.userId, path: input.path }),
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
		createImage(input, f.deps, { action: "addImage" }),
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
			createImage(input, f.deps, { action: "addImage" }),
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
	await expect(deleteImage(id, input.userId, f.deps)).rejects.toThrow(
		"not deletable",
	);
	expect(f.dispatch).not.toHaveBeenCalled();
	await deleteImage(id, input.userId, f.deps);
	expect(f.deleteById).toHaveBeenCalledWith(
		id,
		input.userId,
		makeUnexportedStatus(),
	);
	expect(f.dispatch).toHaveBeenCalledOnce();
});
