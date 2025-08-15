"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import type { ServerAction } from "@/utils/types";

export async function deleteNews(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		await newsCommandRepository.deleteById(id, userId, "UNEXPORTED");

		revalidatePath("/(dumper)");

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
