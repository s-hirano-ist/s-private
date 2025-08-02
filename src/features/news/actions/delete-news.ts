"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction } from "@/types";
import { sendPushoverMessage } from "@/utils/fetch-message";

export async function deleteNews(id: number): Promise<ServerAction<number>> {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) forbidden();

	try {
		const userId = await getSelfId();

		// Check if the news item exists and belongs to the user
		const newsItem = await prisma.news.findUnique({
			where: { id, userId },
		});

		if (!newsItem) throw new UnexpectedError();

		// Delete the news item
		await prisma.news.delete({
			where: { id, userId },
		});

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
