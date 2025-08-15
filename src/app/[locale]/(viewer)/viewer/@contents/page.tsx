import { Suspense } from "react";
import Loading from "@/common/components/loading";
import { getExportedContents } from "@/features/contents/actions/get-contents";
import { ContentsCounter } from "@/features/contents/components/server/contents-counter";
import { ContentsStack } from "@/features/contents/components/server/contents-stack";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "contents") return <div />;

	return (
		<>
			<ContentsCounter />

			<Suspense fallback={<Loading />}>
				<ContentsStack getContents={getExportedContents} page={currentPage} />
			</Suspense>
		</>
	);
}
