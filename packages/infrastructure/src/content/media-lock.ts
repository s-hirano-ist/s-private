import type { MediaLock } from "@s-hirano-ist/s-application/content/media-lifecycle";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { randomUUID } from "node:crypto";

const LEASE_MS = 10 * 60 * 1000;
/** Shared by HTTP mutations, import CLI and cleanup. Never hold a DB transaction during I/O. */
export function createMediaLock(
	database: Pick<DatabaseClient, "mediaObjectLock">,
): MediaLock {
	return {
		async run(domain, path, work) {
			const key = { domain, path };
			await database.mediaObjectLock.upsert({
				where: { domain_path: key },
				create: key,
				update: {},
			});
			const token = randomUUID();
			const claim = await database.mediaObjectLock.updateMany({
				where: {
					...key,
					OR: [{ token: null }, { expiresAt: { lte: new Date() } }],
				},
				data: { token, expiresAt: new Date(Date.now() + LEASE_MS) },
			});
			if (!claim.count) throw new ApplicationError("OPERATION_IN_PROGRESS");
			const assertActive = async () => {
				const renewed = await database.mediaObjectLock.updateMany({
					where: { ...key, token, expiresAt: { gt: new Date() } },
					data: { expiresAt: new Date(Date.now() + LEASE_MS) },
				});
				if (!renewed.count) throw new ApplicationError("OPERATION_IN_PROGRESS");
			};
			try {
				return await work(assertActive);
			} finally {
				await database.mediaObjectLock.deleteMany({
					where: { ...key, token },
				});
			}
		},
	};
}
