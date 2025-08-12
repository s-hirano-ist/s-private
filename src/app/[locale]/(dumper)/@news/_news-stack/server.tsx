import { StatusCodeView } from "@/components/status/status-code-view";
import { deleteNews } from "@/features/news/actions/delete-news";
import { newsRepository } from "@/features/news/repositories/news-repository";
import { loggerError } from "@/pino";
import { getSelfId } from "@/utils/auth/session";
import { NewsStackClient } from "./client";

export async function NewsStack() {
	try {
		const userId = await getSelfId();

		const unexportedNews = (
			await newsRepository.findByStatusAndUserIdWithCategory("UNEXPORTED", userId)
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
