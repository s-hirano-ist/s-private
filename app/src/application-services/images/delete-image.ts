/**
 * Image deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import { makeUnexportedStatus } from "@s-hirano-ist/s-core/common/entities/common-entity";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";

/**
 * Server action to delete an image.
 *
 * @remarks
 * Only unexported images can be deleted. Requires dumper role permission.
 *
 * @param id - Image ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteImage(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const status = makeUnexportedStatus();
		await imagesCommandRepository.deleteById(id, userId, status);

		revalidateTag(buildContentCacheTag("images", status, userId));
		revalidateTag(buildCountCacheTag("images", status, userId));

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
