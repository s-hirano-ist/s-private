import { StatusCodeView } from "@/components/status/status-code-view";
import { deleteNews } from "@/features/news/actions/delete-news";
import { getUnexportedNews } from "@/features/news/actions/get-news";
import { loggerError } from "@/pino";
import { NewsStackClient } from "./client";

export async function NewsStack() {
	try {
		const unexportedNews = await getUnexportedNews();

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
