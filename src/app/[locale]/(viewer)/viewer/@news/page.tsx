import { Suspense } from "react";
import Loading from "@/components/loading";
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
			<Suspense>
				<NewsCounter page={currentPage} />
			</Suspense>
			<Suspense fallback={<Loading />}>
				<StaticNewsStack page={currentPage} />
			</Suspense>
		</>
	);
}
