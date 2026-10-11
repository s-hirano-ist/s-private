import type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
import type { z } from "zod";
import { defaultMobileDeps } from "@/application-services/mobile/deps";
import {
	getSyncHead as head,
	listSyncSnapshot as snapshot,
	listSyncChanges as changes,
	type snapshotQuerySchema,
	type changesQuerySchema,
} from "@s-hirano-ist/s-backend/mobile/sync";
export {
	snapshotQuerySchema,
	changesQuerySchema,
} from "@s-hirano-ist/s-backend/mobile/sync";
export const getSyncHead = (
	userId: string,
	deps: Pick<MobileDeps, "sync"> = defaultMobileDeps,
) => head(userId, deps);
export const listSyncSnapshot = (
	userId: string,
	query: z.infer<typeof snapshotQuerySchema>,
	deps: Pick<MobileDeps, "sync"> = defaultMobileDeps,
) => snapshot(userId, query, deps);
export const listSyncChanges = (
	userId: string,
	query: z.infer<typeof changesQuerySchema>,
	deps: Pick<MobileDeps, "sync"> = defaultMobileDeps,
) => changes(userId, query, deps);
