"use server";
import "server-only";
import { SUCCESS_MESSAGES } from "@/constants";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getUserId,
	hasSelfPostPermissionOrThrow,
} from "@/features/auth/utils/get-session";
import type { News } from "@/features/news/types";
import { validateCategory } from "@/features/news/utils/validate-category";
import { validateNews } from "@/features/news/utils/validate-news";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction } from "@/types";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatCreateNewsMessage } from "@/utils/format-for-line";
import { revalidatePath } from "next/cache";

export async function addNews(formData: FormData): Promise<ServerAction<News>> {
	try {
		await hasSelfPostPermissionOrThrow();

		const userId = await getUserId();

		const validatedCategory = validateCategory(formData);

		const category = await prisma.categories.upsert({
			where: { name_userId: { userId, name: validatedCategory.name } },
			update: {},
			create: { userId, ...validatedCategory },
		});

		formData.set("category", String(category.id));

		const createdNews = await prisma.news.create({
			data: { userId, ...validateNews(formData) },
			select: {
				id: true,
				title: true,
				quote: true,
				url: true,
				Category: true,
			},
		});

		const message = formatCreateNewsMessage(createdNews);
		loggerInfo(message, {
			caller: "addNews",
			status: 200,
		});
		await sendLineNotifyMessage(message);
		revalidatePath("/dumper");

		return {
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: {
				...createdNews,
				category: createdNews.Category.name,
			},
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
