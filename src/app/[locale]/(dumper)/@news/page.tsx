import { Suspense } from "react";
import { LinkCardSkeletonStack } from "@/common/components/card/link-card-skeleton-stack";
import { addNews } from "@/features/news/actions/add-news";
import { deleteNews } from "@/features/news/actions/delete-news";
import { getUnexportedNews } from "@/features/news/actions/get-news";
import { NewsForm } from "@/features/news/components/server/news-form";
import { NewsStack } from "@/features/news/components/server/news-stack";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "news") return <div />;

	return (
		<>
			<NewsForm addNews={addNews} />

			<Suspense fallback={<LinkCardSkeletonStack />}>
				<NewsStack
					deleteNews={deleteNews}
					getNews={getUnexportedNews}
					page={currentPage}
				/>
			</Suspense>
		</>
	);
}
