import { Suspense } from "react";
import { getExportedNews } from "@/applications/news/get-news";
import Loading from "@/components/common/loading";
import { NewsCounter } from "@/components/news/server/news-counter";
import { NewsStack } from "@/components/news/server/news-stack";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "news") return <div />;

	return (
		<>
			<NewsCounter page={currentPage} />

			<Suspense fallback={<Loading />}>
				<NewsStack
					getNews={getExportedNews}
					key={currentPage}
					page={currentPage}
				/>
			</Suspense>
		</>
	);
}
