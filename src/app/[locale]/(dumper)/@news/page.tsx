import { Suspense } from "react";
import { addNews } from "@/application-services/news/add-news";
import { deleteNews } from "@/application-services/news/delete-news";
import {
	getCategories,
	getExportedNews,
	getNewsCount,
	getUnexportedNews,
} from "@/application-services/news/get-news";
import Loading from "@/components/common/display/loading";
import { NewsCounter } from "@/components/news/server/news-counter";
import { NewsForm } from "@/components/news/server/news-form";
import { NewsStack } from "@/components/news/server/news-stack";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "news") return <div />;

	switch (layout) {
		case "viewer":
			return (
				<>
					<NewsCounter currentPage={currentPage} getNewsCount={getNewsCount} />

					<Suspense fallback={<Loading />}>
						<NewsStack
							getNews={getExportedNews}
							key={currentPage}
							page={currentPage}
						/>
					</Suspense>
				</>
			);
		case "dumper":
		default:
			return (
				<>
					<NewsForm addNews={addNews} getCategories={getCategories} />

					<Suspense fallback={<Loading />}>
						<NewsStack
							deleteNews={deleteNews}
							getNews={getUnexportedNews}
							page={currentPage}
						/>
					</Suspense>
				</>
			);
	}
}
