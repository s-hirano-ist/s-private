import { deleteImage } from "@s-hirano-ist/s-application/images/use-cases";
import {
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createMediaDeletionQueue } from "@s-hirano-ist/s-infrastructure/content/media-deletion-queue";
import { createMediaLock } from "@s-hirano-ist/s-infrastructure/content/media-lock";
import { extendDatabase } from "@s-hirano-ist/s-infrastructure/database";
import { createImagesCommandRepository } from "@s-hirano-ist/s-infrastructure/images/command-repository";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import { applyTenantFilter } from "@s-hirano-ist/s-infrastructure/shared/tenant-filter";
import { createTransactionalDatabase } from "@s-hirano-ist/s-infrastructure/transaction";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, test, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;
if (url && !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
	throw new Error("Local database required");
const client = createPrismaClient(
	url ?? "postgresql://root@127.0.0.1:26257/issue2880?sslmode=disable",
);
const prefix = `deletion-${randomUUID()}`;
const owner = makeUserId(prefix);
const { database, transactions } = createTransactionalDatabase(
	extendDatabase(
		client,
		(model, operation, args) =>
			applyTenantFilter(model, operation, args, tenantContext.getStore()),
		() => {},
	),
);
const lock = createMediaLock(database);
const owned = <T>(work: () => Promise<T>) =>
	tenantContext.run({ userId: owner }, work);
function fixture() {
	const storage = {
		deleteImage: vi.fn().mockResolvedValue(undefined),
		uploadImage: vi.fn(),
		getImage: vi.fn(),
		getImageOrThrow: vi.fn(),
	};
	const report = vi.fn();
	const queue = createMediaDeletionQueue(
		database,
		lock,
		{ images: storage, books: storage },
		report,
	);
	return { storage, report, queue };
}
async function record(path: string, userId: string = owner) {
	return client.image.create({
		data: {
			id: makeId(),
			path,
			userId,
			status: "EXPORTED",
			contentType: "image/png",
			createdAt: new Date(),
		},
	});
}
afterAll(async () => {
	if (url) {
		await client.image.deleteMany({ where: { path: { startsWith: prefix } } });
		await client.mediaDeletion.deleteMany({
			where: { path: { startsWith: prefix } },
		});
		await client.mediaObjectLock.deleteMany({
			where: { path: { startsWith: prefix } },
		});
		await client.mobileSyncChange.deleteMany({
			where: { userId: { startsWith: prefix } },
		});
		await client.mobileSyncVersion.deleteMany({
			where: { userId: { startsWith: prefix } },
		});
	}
	await client.$disconnect();
});
describe.skipIf(!url)("durable media deletion", () => {
	test("enqueue failure rolls back deletion and its sync tombstone", async () => {
		const image = await record(`${prefix}-rollback.png`);
		const { queue } = fixture();
		await expect(
			owned(() =>
				deleteImage(makeId(image.id), owner, {
					commandRepository: createImagesCommandRepository(database),
					transactions,
					deletionQueue: {
						...queue,
						enqueue: async () => {
							throw new Error("enqueue failed");
						},
					},
					eventDispatcher: { dispatch: vi.fn() },
				}),
			),
		).rejects.toThrow("enqueue failed");
		expect(
			await client.image.findUnique({ where: { id: image.id } }),
		).not.toBeNull();
		expect(
			await client.mobileSyncChange.count({
				where: { recordId: image.id, action: "delete" },
			}),
		).toBe(0);
	});
	test("partial storage failure preserves a committed deletion, then retries after lease expiry", async () => {
		const image = await record(`${prefix}-retry.png`);
		const { storage, report, queue } = fixture();
		storage.deleteImage
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error("thumbnail unavailable"));
		await owned(() =>
			deleteImage(makeId(image.id), owner, {
				commandRepository: createImagesCommandRepository(database),
				transactions,
				deletionQueue: queue,
				eventDispatcher: { dispatch: vi.fn() },
			}),
		);
		expect(
			await client.image.findUnique({ where: { id: image.id } }),
		).toBeNull();
		expect(
			await client.mobileSyncChange.count({
				where: { recordId: image.id, action: "delete" },
			}),
		).toBe(1);
		const job = await client.mediaDeletion.findFirstOrThrow({
			where: { path: image.path },
		});
		expect(job.attempts).toBe(1);
		expect(report).toHaveBeenCalledOnce();
		await client.mediaDeletion.update({
			where: { id: job.id },
			data: {
				nextAttemptAt: new Date(0),
				leaseToken: "crashed-worker",
				leaseExpiresAt: new Date(0),
			},
		});
		await queue.drain();
		expect(
			await client.mediaDeletion.findUnique({ where: { id: job.id } }),
		).toBeNull();
		expect(storage.deleteImage.mock.calls).toEqual([
			[image.path, false],
			[image.path, true],
			[image.path, false],
			[image.path, true],
		]);
	});
	test("another owner's reference protects shared media even inside a tenant scope", async () => {
		const path = `${prefix}-shared.png`;
		await record(path, `${prefix}-foreign`);
		const { queue, storage } = fixture();
		const id = await owned(() => queue.enqueue("images", owner, path));
		await owned(() => queue.process(id));
		expect(storage.deleteImage).not.toHaveBeenCalled();
		expect(await client.mediaDeletion.findUnique({ where: { id } })).toBeNull();
	});
	test("reimport holds the path until its reference commits; pending cleanup preserves new media", async () => {
		const path = `${prefix}-reimport.png`;
		const { queue, storage } = fixture();
		const id = await queue.enqueue("images", owner, path);
		await lock.run("images", path, async () => {
			await expect(
				lock.run("images", path, async () => {}),
			).rejects.toMatchObject({ code: "OPERATION_IN_PROGRESS" });
			await queue.process(id);
			expect(storage.deleteImage).not.toHaveBeenCalled();
			await record(path);
		});
		await client.mediaDeletion.update({
			where: { id },
			data: { nextAttemptAt: new Date(0) },
		});
		await queue.process(id);
		expect(storage.deleteImage).not.toHaveBeenCalled();
		expect(await client.mediaDeletion.findUnique({ where: { id } })).toBeNull();
	});
	test("duplicate workers claim once and a crashed object lease can be reclaimed", async () => {
		const path = `${prefix}-concurrent.png`;
		await client.mediaObjectLock.create({
			data: {
				domain: "images",
				path,
				token: "crashed",
				expiresAt: new Date(0),
			},
		});
		const { queue, storage } = fixture();
		const id = await queue.enqueue("images", owner, path);
		await Promise.all([queue.process(id), queue.process(id)]);
		expect(storage.deleteImage.mock.calls).toEqual([
			[path, false],
			[path, true],
		]);
		expect(await client.mediaDeletion.findUnique({ where: { id } })).toBeNull();
	});
	test("missing storage objects count as successfully cleaned", async () => {
		const { queue, storage } = fixture();
		const path = `${prefix}-missing.png`;
		storage.deleteImage.mockRejectedValueOnce({
			name: "NoSuchKey",
			$metadata: { httpStatusCode: 404 },
		});
		const id = await queue.enqueue("images", owner, path);
		await queue.process(id);
		expect(await client.mediaDeletion.findUnique({ where: { id } })).toBeNull();
		expect(storage.deleteImage).toHaveBeenCalledTimes(2);
	});
	test("a stale writer cannot commit or release a replacement lease", async () => {
		const path = `${prefix}-stale.png`;
		await lock.run("images", path, async (assertActive) => {
			await client.mediaObjectLock.update({
				where: { domain_path: { domain: "images", path } },
				data: { token: "replacement" },
			});
			await expect(assertActive()).rejects.toMatchObject({
				code: "OPERATION_IN_PROGRESS",
			});
		});
		expect(
			(
				await client.mediaObjectLock.findUniqueOrThrow({
					where: { domain_path: { domain: "images", path } },
				})
			).token,
		).toBe("replacement");
	});
});
