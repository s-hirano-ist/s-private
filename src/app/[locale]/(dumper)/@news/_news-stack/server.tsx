import { StatusCodeView } from "@/components/card/status-code-view";
import { getSelfId } from "@/features/auth/utils/session";
import { deleteNews } from "@/features/news/actions/delete-news";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { NewsStackClient } from "./client";

export async function NewsStack() {
	try {
		const userId = await getSelfId();

		const unexportedNews = (
			await prisma.news.findMany({
				where: { status: "UNEXPORTED", userId },
				select: {
					id: true,
					title: true,
					quote: true,
					url: true,
					Category: { select: { name: true } },
				},
				orderBy: { id: "desc" },
			})
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
			<NewsStackClient cardStackData={unexportedNews} deleteNews={deleteNews} />
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
