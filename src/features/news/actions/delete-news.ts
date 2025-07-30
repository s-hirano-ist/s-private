"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { NotAllowedError, UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { loggerInfo } from "@/pino";
import db from "@/db";
import { news } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ServerAction } from "@/types";
import { sendPushoverMessage } from "@/utils/fetch-message";

export async function deleteNews(id: number): Promise<ServerAction<number>> {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) throw new NotAllowedError();

		const userId = await getSelfId();

		// Check if the news item exists and belongs to the user
		const newsItems = await db
			.select()
			.from(news)
			.where(and(eq(news.id, id), eq(news.userId, userId)))
			.limit(1);

		if (newsItems.length === 0) throw new UnexpectedError();

		const newsItem = newsItems[0];

		// Delete the news item
		await db.delete(news).where(and(eq(news.id, id), eq(news.userId, userId)));

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
