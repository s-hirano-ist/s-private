"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { categoryCommandRepository } from "@/features/news/repositories/category-command-repository";
import { newsCommandRepository } from "@/features/news/repositories/news-command-repository";
import { validateCategory } from "@/features/news/utils/validate-category";
import { validateNews } from "@/features/news/utils/validate-news";
import { serverLogger } from "@/o11y/server";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { formatCreateNewsMessage } from "@/utils/notification/format-for-notification";

type News = {
	category: string;
	id: string;
	quote: string | null;
	title: string;
	url: string;
};

export async function addNews(formData: FormData): Promise<ServerAction<News>> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const validatedCategory = validateCategory(formData);

		const category = await categoryCommandRepository.upsert({
			userId,
			name: validatedCategory.name,
		});

		formData.set("category", String(category.id));
		const validatedNews = validateNews(formData);

		const createdNews = await newsCommandRepository.create({
			userId,
			...validatedNews,
		});

		const message = formatCreateNewsMessage(createdNews);
		const context = {
			caller: "addNews" as const,
			status: 201 as const,
			userId,
		};
		serverLogger.info(message, context, { notify: true });
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
