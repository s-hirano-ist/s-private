"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { categoryRepository } from "@/features/news/repositories/category-repository";
import { newsRepository } from "@/features/news/repositories/news-repository";
import { validateCategory } from "@/features/news/utils/validate-category";
import { validateNews } from "@/features/news/utils/validate-news";
import { loggerInfo } from "@/pino";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { formatCreateNewsMessage } from "@/utils/notification/format-for-notification";

type News = {
	category: string;
	id: number;
	quote: string | null;
	title: string;
	url: string;
};

export async function addNews(formData: FormData): Promise<ServerAction<News>> {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) forbidden();

	try {
		const userId = await getSelfId();

		const validatedCategory = validateCategory(formData);

		const category = await categoryRepository.upsert({
			userId,
			name: validatedCategory.name,
		});

		formData.set("category", String(category.id));
		const validatedNews = validateNews(formData);

		const createdNews = await newsRepository.create({
			userId,
			title: validatedNews.title,
			url: validatedNews.url,
			quote: validatedNews.quote,
			categoryId: validatedNews.categoryId,
		});

		const message = formatCreateNewsMessage(createdNews);
		loggerInfo(message, {
			caller: "addNews",
			status: 200,
		});
		await sendPushoverMessage(message);
		revalidatePath("/(dumper)");

		return {
			success: true,
			message: "inserted",
			data: {
				...createdNews,
				category: createdNews.Category.name,
			},
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
