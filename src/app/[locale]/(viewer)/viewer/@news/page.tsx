import { Suspense } from "react";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { NewsCounter } from "./_news-counter/server";
import { StaticNewsStack } from "./_static-news-stack/server";

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
			<Suspense fallback={<CardStackSkeleton />}>
				<StaticNewsStack page={currentPage} />
			</Suspense>
		</>
	);
}
