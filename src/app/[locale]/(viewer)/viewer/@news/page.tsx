import { Suspense } from "react";
import { LinkCardSkeletonStack } from "@/components/card/link-card-skeleton-stack";
import { getExportedNews } from "@/features/news/actions/get-news";
import { NewsCounter } from "@/features/news/components/server/news-counter";
import { NewsStack } from "@/features/news/components/server/news-stack";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "news") return <div />;

	return (
		<>
			<NewsCounter page={currentPage} />

			<Suspense fallback={<LinkCardSkeletonStack />}>
				<NewsStack
					getNews={getExportedNews}
					key={currentPage}
					page={currentPage}
				/>
			</Suspense>
		</>
	);
}
