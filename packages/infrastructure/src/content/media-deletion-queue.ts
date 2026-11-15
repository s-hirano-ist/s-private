import type {
	MediaDeletionQueue,
	MediaDomain,
	MediaLock,
} from "@s-hirano-ist/s-application/content/media-lifecycle";
import type { IStorageService } from "@s-hirano-ist/s-application/content/storage-port";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { tenantContext } from "@s-hirano-ist/s-infrastructure/shared/tenant-context";
import {
	isObjectNotFound,
	StorageOperationError,
} from "@s-hirano-ist/s-storage";
import { randomUUID } from "node:crypto";

const DAY_MS = 24 * 60 * 60 * 1000;
export function createMediaDeletionQueue(
	database: Pick<DatabaseClient, "mediaDeletion" | "image" | "book">,
	lock: MediaLock,
	storage: Record<MediaDomain, IStorageService>,
	report: (error: unknown) => unknown,
) {
	async function process(id: string): Promise<void> {
		const token = randomUUID();
		try {
			const claimed = await database.mediaDeletion.updateMany({
				where: {
					id,
					nextAttemptAt: { lte: new Date() },
					OR: [{ leaseToken: null }, { leaseExpiresAt: { lte: new Date() } }],
				},
				data: {
					leaseToken: token,
					leaseExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
					attempts: { increment: 1 },
				},
			});
			if (!claimed.count) return;
			const job = await database.mediaDeletion.findUniqueOrThrow({
				where: { id },
			});
			if (job.domain !== "images" && job.domain !== "books")
				throw new Error("Invalid media cleanup domain");
			const domain = job.domain;
			await lock.run(domain, job.path, async (assertActive) => {
				// Deliberately global: another owner's record can reference the same key.
				const referenced = await tenantContext.run(
					{ system: true, userId: "media-cleanup" },
					async () =>
						await (domain === "images"
							? database.image.count({ where: { path: job.path } })
							: database.book.count({ where: { imagePath: job.path } })),
				);
				if (!referenced) {
					for (const thumbnail of [false, true]) {
						await assertActive();
						try {
							await storage[domain].deleteImage(job.path, thumbnail);
						} catch (error) {
							if (
								!isObjectNotFound(
									error instanceof StorageOperationError ? error.cause : error,
								)
							)
								throw error;
						}
					}
				}
				await database.mediaDeletion.deleteMany({
					where: { id, leaseToken: token },
				});
			});
		} catch (error) {
			// A committed content deletion must not become an HTTP failure.
			try {
				await database.mediaDeletion.updateMany({
					where: { id, leaseToken: token },
					data: {
						leaseToken: null,
						leaseExpiresAt: null,
						nextAttemptAt: new Date(Date.now() + DAY_MS),
					},
				});
			} catch (retryError) {
				reportSafely(retryError);
			}
			reportSafely(error);
		}
	}
	function reportSafely(error: unknown) {
		try {
			report(error);
		} catch {
			/* Reporting must not affect a committed deletion. */
		}
	}
	const queue: MediaDeletionQueue = {
		async enqueue(domain, userId, path) {
			const id = randomUUID();
			await database.mediaDeletion.create({
				data: { id, domain, userId, path },
			});
			return id;
		},
		process,
	};
	return {
		...queue,
		async drain() {
			const due = await database.mediaDeletion.findMany({
				where: {
					nextAttemptAt: { lte: new Date() },
					OR: [{ leaseToken: null }, { leaseExpiresAt: { lte: new Date() } }],
				},
				orderBy: [{ nextAttemptAt: "asc" }, { id: "asc" }],
				take: 100,
				select: { id: true },
			});
			const deadline = Date.now() + 240000;
			let processed = 0;
			for (const job of due) {
				// Reserve two bounded storage requests before starting another item.
				if (Date.now() + 120000 > deadline) break;
				await process(job.id);
				processed++;
			}
			return { processed };
		},
	};
}
