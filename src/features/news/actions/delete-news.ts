"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { newsCommandRepository } from "@/features/news/repositories/news-command-repository";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";
import { loggerInfo } from "@/pino";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";

export async function deleteNews(id: number): Promise<ServerAction<number>> {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) forbidden();

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
		loggerInfo(message, {
			caller: "deleteNews",
			status: 200,
		});
		await sendPushoverMessage(message);
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
