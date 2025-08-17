"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { withPermissionCheck } from "@/common/auth/permission-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";

async function deleteImagesImpl(id: string): Promise<ServerAction> {
	const userId = await getSelfId();

	await imagesCommandRepository.deleteById(id, userId, "UNEXPORTED");

	revalidateTag(`images_UNEXPORTED_${userId}`);
	revalidateTag(`images_count_UNEXPORTED_${userId}`);

	return { success: true, message: "deleted" };
}

export const deleteImages = withPermissionCheck(
	hasDumperPostPermission,
	deleteImagesImpl,
);
