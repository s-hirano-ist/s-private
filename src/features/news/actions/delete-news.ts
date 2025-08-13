"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { newsCommandRepository } from "@/features/news/repositories/news-command-repository";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";
import { serverLogger } from "@/infrastructure/server";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";

export async function deleteNews(id: string): Promise<ServerAction<string>> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		// Check if the news item exists and belongs to the user
		const newsItem = await newsQueryRepository.findById(
			id,
			userId,
			"UNEXPORTED",
		);

		if (!newsItem) throw new UnexpectedError();

		// Delete the news item
		await newsCommandRepository.deleteById(id, userId, "UNEXPORTED");

		const message = `Deleted news: ${newsItem.title}`;
		const context = {
			caller: "deleteNews" as const,
			status: 200 as const,
			userId,
		};
		serverLogger.info(message, context, { notify: true });
		revalidatePath("/(dumper)");

		return {
			success: true,
			message: "deleted",
			data: id,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
