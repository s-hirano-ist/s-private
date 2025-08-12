import { Suspense } from "react";
import { LinkCardSkeletonStack } from "@/components/card/link-card-skeleton-stack";
import { NewsCounter } from "./_news-counter/server";
import { NewsStack } from "./_news-stack/server";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;
	const currentPage = Number(page) || 1;
	const activeTab = tab as string;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (activeTab && activeTab !== "news") {
		return <div />;
	}

	return (
		<>
			<NewsCounter page={currentPage} />
			<Suspense fallback={<LinkCardSkeletonStack />}>
				<NewsStack page={currentPage} />
			</Suspense>
		</>
	);
}
