"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { withPermissionCheck } from "@/common/auth/permission-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";

async function deleteContentsImpl(id: string): Promise<ServerAction> {
	const userId = await getSelfId();

	await contentsCommandRepository.deleteById(id, userId, "UNEXPORTED");

	revalidateTag(`contents_UNEXPORTED_${userId}`);
	revalidateTag(`contents_count_UNEXPORTED_${userId}`);

	return { success: true, message: "deleted" };
}

export const deleteContents = withPermissionCheck(
	hasDumperPostPermission,
	deleteContentsImpl,
);
