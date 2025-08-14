"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { newsCommandRepository } from "@/infrastructure/news/repositories/news-command-repository";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { wrapServerSideErrorForClient } from "@/utils/error/error-wrapper";
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
