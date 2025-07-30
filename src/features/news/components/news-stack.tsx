"use server";
import "server-only";
import { StatusCodeView } from "@/components/card/status-code-view";
import { CardStack } from "@/components/stack/card-stack";
import { getSelfId } from "@/features/auth/utils/session";
import { deleteNews } from "@/features/news/actions/delete-news";
import { loggerError } from "@/pino";
import db from "@/db";
import { news, categories } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function NewsStack() {
	try {
		const userId = await getSelfId();

		const unexportedNews = (
			await db
				.select({
					id: news.id,
					title: news.title,
					quote: news.quote,
					url: news.url,
					Category: { name: categories.name },
				})
				.from(news)
				.innerJoin(categories, eq(news.categoryId, categories.id))
				.where(and(eq(news.status, "UNEXPORTED"), eq(news.userId, userId)))
				.orderBy(desc(news.id))
		).map((d) => {
			return {
				id: d.id,
				title: d.title,
				quote: d.quote,
				url: d.url,
				category: d.Category.name,
			};
		});
		return (
			<CardStack
				data={unexportedNews}
				deleteAction={deleteNews}
				showDeleteButton
			/>
		);
	} catch (error) {
		loggerError(
			"unexpected",
			{
				caller: "NewsStack",
				status: 500,
			},
			error,
		);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
