import type { MobileUpload } from "@s-hirano-ist/s-application/mobile/ports";
import type {
	MediaInput,
	WriteService,
} from "s-private-backend/api/write-service";
import { createUploadService } from "s-private-backend/api/upload-service";
import { describe, expect, test, vi } from "vitest";
const operationId = "0199cb00-0000-7000-8000-000000000001";
const input: MediaInput = {
	operationId,
	domain: "books",
	contentType: "image/png",
	fileSize: 3,
	metadata: {
		isbn: "9781234567890",
		title: "Book",
		rating: 3,
		tags: ["a,b", "c"],
		filename: "cover.png",
	},
};
function fixture() {
	let record: MobileUpload | null = null;
	const uploads = {
		findExpiredUploads: vi.fn(async () => []),
		findUploadByOperation: vi.fn(async () => record),
		findUpload: vi.fn(async (owner: string) =>
			record?.userId === owner ? record : null,
		),
		createUpload: vi.fn(async (value: Omit<MobileUpload, "receivedParts">) => {
			record = { ...value, receivedParts: [] };
			return record;
		}),
		updateUploadParts: vi.fn(async (_id: string, parts: number[]) => {
			if (record) record.receivedParts = parts;
		}),
		deleteUpload: vi.fn(async () => {
			record = null;
		}),
	};
	const chunks = {
		put: vi.fn(async () => {}),
		get: vi.fn(async () => Buffer.from("png")),
		remove: vi.fn(async () => {}),
	};
	const media = vi.fn<WriteService["media"]>().mockResolvedValue({
		accepted: true,
		operationId,
		resource: { id: "book", type: "books" },
	});
	return {
		uploads,
		chunks,
		media,
		service: createUploadService({ uploads, chunks }, { media }),
		setRecord(value: MobileUpload | null) {
			record = value;
		},
	};
}
describe("Shared API resumable uploads", () => {
	test("preserves array tags and resumes identical metadata without creating another session", async () => {
		const { service, uploads, media } = fixture();
		const started = await service.start("owner", input);
		expect(await service.start("owner", input)).toEqual(started);
		expect(uploads.createUpload).toHaveBeenCalledOnce();
		await service.put("owner", started.uploadId, 0, new Uint8Array([1, 2, 3]));
		await service.complete("owner", started.uploadId);
		expect(media.mock.calls[0][1]).toEqual(input);
		expect(uploads.deleteUpload).toHaveBeenCalledOnce();
	});
	test("rejects conflicting metadata, foreign ownership, invalid chunk sizes and missing parts", async () => {
		const { service, chunks } = fixture();
		const { uploadId } = await service.start("owner", input);
		await expect(
			service.start("owner", { ...input, fileSize: 4 }),
		).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
		await expect(service.get("foreign", uploadId)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
		await expect(
			service.put("owner", uploadId, 0, new Uint8Array(2)),
		).rejects.toMatchObject({ code: "INVALID_CHUNK_SIZE" });
		await expect(
			service.put("owner", uploadId, 1, new Uint8Array(3)),
		).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
		await expect(service.complete("owner", uploadId)).rejects.toMatchObject({
			code: "UPLOAD_INCOMPLETE",
		});
		expect(chunks.put).not.toHaveBeenCalled();
	});
	test("keeps uploaded chunks when creation fails so the operation can be retried", async () => {
		const { service, media, chunks, uploads } = fixture();
		const { uploadId } = await service.start("owner", input);
		await service.put("owner", uploadId, 0, new Uint8Array(3));
		media.mockRejectedValue(new Error("storage unavailable"));
		await expect(service.complete("owner", uploadId)).rejects.toThrow(
			"storage unavailable",
		);
		expect(chunks.remove).not.toHaveBeenCalled();
		expect(uploads.deleteUpload).not.toHaveBeenCalled();
	});
	test("resumes legacy book metadata and passes its original hash fields to creation", async () => {
		const { service, setRecord, media } = fixture();
		const metadata = {
			isbn: "9781234567890",
			title: "Book",
			rating: "3",
			tags: " a , b, ",
		};
		setRecord({
			id: "legacy",
			userId: "owner",
			operationId,
			domain: "books",
			contentType: "image/png",
			fileSize: 3,
			metadata,
			receivedParts: [0],
			expiresAt: new Date(Date.now() + 60000),
		});
		const modern: MediaInput = {
			...input,
			metadata: { ...input.metadata, tags: [" a ", " b", " "] },
		};
		const resumed = await service.start("owner", modern);
		expect(resumed.uploadId).toBe("legacy");
		expect(resumed.receivedParts).toEqual([0]);
		await expect(
			service.start("owner", {
				...modern,
				metadata: { ...modern.metadata, tags: ["different"] },
			}),
		).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
		await service.complete("owner", "legacy");
		expect(media.mock.calls[0][3]).toEqual(metadata);
	});
	test("rejects expired sessions and cancels owned sessions", async () => {
		const { service, setRecord, uploads } = fixture();
		setRecord({
			id: "expired",
			userId: "owner",
			operationId,
			domain: "images",
			contentType: "image/png",
			fileSize: 3,
			metadata: {},
			receivedParts: [],
			expiresAt: new Date(0),
		});
		await expect(service.get("owner", "expired")).rejects.toMatchObject({
			code: "UPLOAD_EXPIRED",
		});
		setRecord(null);
		const { uploadId } = await service.start("owner", input);
		// The repository fixture deliberately returns no expired rows; restore an active session.
		setRecord({
			id: uploadId,
			userId: "owner",
			operationId,
			domain: "books",
			contentType: "image/png",
			fileSize: 3,
			metadata: {},
			receivedParts: [],
			expiresAt: new Date(Date.now() + 60000),
		});
		await service.cancel("owner", uploadId);
		expect(uploads.deleteUpload).toHaveBeenCalledOnce();
	});
});
