/**
 * Image deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { requireAuth } from "@/common/auth/session";
import { makeId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { deleteImageCore } from "./delete-image.core";
import { defaultDeleteImageDeps } from "./delete-image.deps";

/**
 * Server action to delete an image.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to deleteImageCore for business logic.
 *
 * Only unexported images can be deleted. Requires dumper role permission.
 *
 * @param rawId - Image ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteImage(rawId: string): Promise<ServerAction> {
	await requireAuth();

	const id = makeId(rawId);

	return deleteImageCore(id, defaultDeleteImageDeps);
}
