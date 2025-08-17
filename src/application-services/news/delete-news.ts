"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";

export async function deleteNews(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		await newsCommandRepository.deleteById(id, userId, "UNEXPORTED");

		revalidateTag(`news_UNEXPORTED_${userId}`);

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
