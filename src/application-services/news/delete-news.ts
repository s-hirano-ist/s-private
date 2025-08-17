"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { withPermissionCheck } from "@/common/auth/permission-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";

async function deleteNewsImpl(id: string): Promise<ServerAction> {
	const userId = await getSelfId();

	await newsCommandRepository.deleteById(id, userId, "UNEXPORTED");

	revalidateTag(`news_UNEXPORTED_${userId}`);
	revalidateTag(`news_count_UNEXPORTED_${userId}`);

	return { success: true, message: "deleted" };
}

export const deleteNews = withPermissionCheck(
	hasDumperPostPermission,
	deleteNewsImpl,
);
