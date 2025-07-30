"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { NotAllowedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { validateCategory } from "@/features/news/utils/validate-category";
import { validateNews } from "@/features/news/utils/validate-news";
import { loggerInfo } from "@/pino";
import db from "@/db";
import { categories, news } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ServerAction } from "@/types";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { formatCreateNewsMessage } from "@/utils/format-for-notification";

type News = {
	category: string;
	id: number;
	quote: string | null;
	title: string;
	url: string;
};

export async function addNews(formData: FormData): Promise<ServerAction<News>> {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) throw new NotAllowedError();

		const userId = await getSelfId();

		const validatedCategory = validateCategory(formData);

		const existingCategory = await db
			.select()
			.from(categories)
			.where(
				and(eq(categories.name, validatedCategory.name), eq(categories.userId, userId)),
			)
			.limit(1);

		let category;
		if (existingCategory.length > 0) {
			category = existingCategory[0];
		} else {
			const [newCategory] = await db
				.insert(categories)
				.values({ userId, ...validatedCategory })
				.returning();
			category = newCategory;
		}

		formData.set("category", String(category.id));

		const [createdNewsItem] = await db
			.insert(news)
			.values({ userId, ...validateNews(formData) })
			.returning();

		const createdNews = {
			...createdNewsItem,
			Category: category,
		};

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
