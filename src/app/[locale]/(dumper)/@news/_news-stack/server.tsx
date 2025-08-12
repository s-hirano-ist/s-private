import { StatusCodeView } from "@/components/status/status-code-view";
import { deleteNews } from "@/features/news/actions/delete-news";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { getSelfId } from "@/utils/auth/session";
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
				description: d.quote ?? undefined,
				href: d.url,
				badgeText: d.Category.name,
			};
		});

		return <NewsStackClient data={unexportedNews} deleteNews={deleteNews} />;
	} catch (error) {
		loggerError("unexpected", { caller: "NewsStack", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
