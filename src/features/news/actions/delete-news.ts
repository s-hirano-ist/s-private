"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { newsCommandRepository } from "@/features/news/repositories/news-command-repository";
import { newsQueryRepository } from "@/features/news/repositories/news-query-repository";
import { serverLogger } from "@/o11y/server";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { UnexpectedError } from "@/utils/error/error-classes";
import { wrapServerSideErrorForClient } from "@/utils/error/error-wrapper";

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

		serverLogger.info(
			`【NEWS】\n\n削除\ntitle: ${newsItem.title}`,
			{ caller: "deleteNews", status: 200, userId },
			{ notify: true },
		);
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
