import { Suspense } from "react";
import { addNews } from "@/applications/news/add-news";
import { deleteNews } from "@/applications/news/delete-news";
import { getUnexportedNews } from "@/applications/news/get-news";
import Loading from "@/components/common/loading";
import { NewsForm } from "@/components/news/server/news-form";
import { NewsStack } from "@/components/news/server/news-stack";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "news") return <div />;

	return (
		<>
			<NewsForm addNews={addNews} />

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
