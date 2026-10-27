import { runMobileOperation } from "@s-hirano-ist/s-application/mobile/operations";
import {
	createUploads,
	uploadChunkSize,
	type UploadInput,
} from "@s-hirano-ist/s-application/mobile/uploads";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { createMobileChunkStore } from "@s-hirano-ist/s-infrastructure/mobile/s3-chunk-store";
import { createOperationRepository } from "@s-hirano-ist/s-infrastructure/mobile/operation-repository";
import { createUploadRepository } from "@s-hirano-ist/s-infrastructure/mobile/upload-repository";
import { createTransactionalDatabase } from "@s-hirano-ist/s-infrastructure/transaction";
import { createObjectStorageClient } from "@s-hirano-ist/s-storage";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const enabled = !!url && process.env.TEST_UPLOAD_INTEGRATION === "1";
if (url && !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
	throw new Error("Local database required");
const client = createPrismaClient(
	url ?? "postgresql://root@127.0.0.1:26257/issue2951?sslmode=disable",
);
const { database, transactions } = createTransactionalDatabase(
	extendDatabase(
		client,
		(_model, _op, args) => args,
		() => {},
	),
);
const uploads = createUploadRepository(database);
const operations = createOperationRepository(database);
const owner = `upload-${randomUUID()}`;
const bucket = `issue2951-${randomUUID()}`;
const minio = enabled
	? createObjectStorageClient({
			endpoint: "http://127.0.0.1:9000",
 region: "us-east-1",
 forcePathStyle: true,
			accessKeyId: process.env.MINIO_ROOT_USER ?? "",
			secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "",
		})
	: null;
function fixture() {
	if (!minio) throw new Error("Storage test is disabled");
	const store = createMobileChunkStore(minio, bucket);
	const chunks = {
		get: vi.fn(store.get),
		put: vi.fn(store.put),
		remove: vi.fn(store.remove),
	};
	const reporter = { captureException: vi.fn() };
	const write = vi.fn(
		async (
			userId: string,
			input: UploadInput,
			_file: File,
			guard: () => Promise<void>,
		) =>
			runMobileOperation(
				userId,
				input.domain,
				input.operationId,
				input,
				(commit) =>
					commit(async () => {
						await guard();
						return randomUUID();
					}),
				{ operations, transactions },
			),
	);
	return {
		service: createUploads({ uploads, chunks, reporter }, write),
		chunks,
		write,
		reporter,
	};
}
function makeInput(fileSize = 3): UploadInput {
	return {
		operationId: randomUUID(),
		domain: "images",
		contentType: "image/png",
		fileSize,
		metadata: { filename: "test.png" },
	};
}
beforeAll(async () => {
	if (minio) await minio.createBucket(bucket);
});
afterAll(async () => {
	if (enabled && minio) {
		const objects: string[] = [];
		objects.push(...await minio.listObjects(bucket, ""));
		if (objects.length > 0) await Promise.all(objects.map((key) => minio.removeObject(bucket, key)));
		await minio.deleteBucket(bucket);
		await database.mobileUpload.deleteMany({ where: { userId: owner } });
		await database.mobileOperation.deleteMany({ where: { userId: owner } });
	}
	await client.$disconnect();
});
describe.skipIf(!enabled)(
	"upload concurrency on CockroachDB and local MinIO",
	() => {
		test("atomic start and parallel parts retain all bytes; identical resends pass and different bytes conflict", async () => {
			const { service } = fixture();
			const request = makeInput(uploadChunkSize + 3);
			const starts = await Promise.all(
				Array.from({ length: 4 }, () => service.start(owner, request)),
			);
			expect(new Set(starts.map((start) => start.uploadId)).size).toBe(1);
			const id = starts[0].uploadId;
			const bytes = new Uint8Array(uploadChunkSize).fill(5);
			await Promise.all([
				service.put(owner, id, 0, bytes),
				service.put(owner, id, 1, new Uint8Array([1, 2, 3])),
			]);
			expect((await service.get(owner, id)).receivedParts).toEqual([0, 1]);
			await Promise.all([
				service.put(owner, id, 0, bytes),
				service.put(owner, id, 0, bytes),
			]);
			await expect(
				service.put(owner, id, 0, new Uint8Array(uploadChunkSize)),
			).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
			const result = await service.complete(owner, id);
			expect(await service.complete(owner, id)).toEqual(result);
			expect((await service.get(owner, id)).receivedParts).toEqual([0, 1]);
			await expect(service.cancel(owner, id)).rejects.toMatchObject({
				code: "OPERATION_CONFLICT",
			});
		});
		test("complete excludes another complete and cancel; cleanup errors cannot reverse a durable result", async () => {
			const { service, write, chunks, reporter } = fixture();
			const request = makeInput();
			const { uploadId: id } = await service.start(owner, request);
			await service.put(owner, id, 0, new Uint8Array([1, 2, 3]));
			let release!: () => void;
			let entered!: () => void;
			const ready = new Promise<void>((resolve) => {
				entered = resolve;
			});
			const gate = new Promise<void>((resolve) => {
				release = resolve;
			});
			const actualWrite = write.getMockImplementation()!;
			write.mockImplementation(async (...args) => {
				entered();
				await gate;
				return actualWrite(...args);
			});
			const task = service.complete(owner, id);
			await ready;
			await expect(service.complete(owner, id)).rejects.toMatchObject({
				code: "OPERATION_IN_PROGRESS",
			});
			await expect(service.cancel(owner, id)).rejects.toMatchObject({
				code: "OPERATION_IN_PROGRESS",
			});
			chunks.remove.mockRejectedValueOnce(new Error("cleanup"));
			release();
			const result = await task;
			expect(reporter.captureException).toHaveBeenCalled();
			expect(await service.complete(owner, id)).toEqual(result);
			await service.cleanup();
			expect(
				await database.mobileUploadChunk.count({ where: { uploadId: id } }),
			).toBe(0);
			expect(
				(await operations.findOperation(request.operationId))?.status,
			).toBe("SUCCEEDED");
		});
		test("failed completion is resumable; foreign, incomplete and expired sessions are rejected", async () => {
			const { service, write } = fixture();
			const request = makeInput();
			const { uploadId: id } = await service.start(owner, request);
			await expect(service.get("foreign", id)).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
			await expect(service.complete(owner, id)).rejects.toMatchObject({
				code: "UPLOAD_INCOMPLETE",
			});
			await service.put(owner, id, 0, new Uint8Array([1, 2, 3]));
			write.mockRejectedValueOnce(new Error("interrupted"));
			await expect(service.complete(owner, id)).rejects.toThrow("interrupted");
			expect((await service.get(owner, id)).receivedParts).toEqual([0]);
			await service.complete(owner, id);
			const cancelled = await service.start(owner, makeInput());
			await service.cancel(owner, cancelled.uploadId);
			await expect(
				service.complete(owner, cancelled.uploadId),
			).rejects.toMatchObject({ code: "UPLOAD_EXPIRED" });
			const expired = await service.start(owner, makeInput());
			await database.mobileUpload.update({
				where: { id: expired.uploadId },
				data: { expiresAt: new Date(0) },
			});
			await expect(service.get(owner, expired.uploadId)).rejects.toMatchObject({
				code: "UPLOAD_EXPIRED",
			});
			await service.cleanup();
			expect(await uploads.findUpload(owner, expired.uploadId)).toBeNull();
		});
	},
);

describe.skipIf(!enabled)("interrupted upload workers", () => {
	test("cancelled uploads cannot be revived by a late chunk writer", async () => {
		const { service, chunks } = fixture();
		const { uploadId: id } = await service.start(owner, makeInput());
		let release!: () => void;
		let entered!: () => void;
		const ready = new Promise<void>((resolve) => {
			entered = resolve;
		});
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const actualPut = chunks.put.getMockImplementation()!;
		chunks.put.mockImplementation(async (...args) => {
			entered();
			await gate;
			return actualPut(...args);
		});
		const task = service.put(owner, id, 0, new Uint8Array([1, 2, 3]));
		const rejected = task.catch((error: unknown) => error);
		await ready;
		await service.cancel(owner, id);
		release();
		expect(await rejected).toMatchObject({ code: "UPLOAD_EXPIRED" });
		expect(
			await database.mobileUploadPart.count({ where: { uploadId: id } }),
		).toBe(0);
		expect(
			await database.mobileUploadChunk.count({ where: { uploadId: id } }),
		).toBe(0);
	});
	test("expired upload leases are recoverable and stale completion tokens are fenced", async () => {
		const { service } = fixture();
		const { uploadId: id } = await service.start(owner, makeInput());
		await service.put(owner, id, 0, new Uint8Array([1, 2, 3]));
		const old = await uploads.claimUpload(owner, id, "complete");
		await database.mobileUpload.update({
			where: { id },
			data: { leaseExpiresAt: new Date(0) },
		});
		const next = await uploads.claimUpload(owner, id, "complete");
		expect(next.token).not.toBe(old.token);
		await expect(
			uploads.assertUploadLease(id, old.token),
		).rejects.toMatchObject({ code: "OPERATION_IN_PROGRESS" });
		await expect(
			uploads.finishUpload(id, old.token, randomUUID()),
		).rejects.toMatchObject({ code: "OPERATION_IN_PROGRESS" });
		await uploads.releaseUpload(id, old.token);
		expect(await uploads.renewUpload(id, next.token)).toBe(true);
		await uploads.releaseUpload(id, next.token);
		expect((await service.complete(owner, id)).accepted).toBe(true);
	});
});
