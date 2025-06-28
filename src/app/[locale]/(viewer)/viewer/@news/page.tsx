import { Suspense } from "react";
import Loading from "@/components/loading";
import { SuspensePage } from "./_page";

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
		<Suspense fallback={<Loading />}>
			<SuspensePage currentPage={currentPage} />
		</Suspense>
	);
}
