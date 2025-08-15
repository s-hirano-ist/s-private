import { Suspense } from "react";
import Loading from "@/common/components/loading";
import { addContents } from "@/features/contents/actions/add-contents";
import { getUnexportedContents } from "@/features/contents/actions/get-contents";
import { ContentsForm } from "@/features/contents/components/server/contents-form";
import { ContentsStack } from "@/features/contents/components/server/contents-stack";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "contents") return <div />;

	return (
		<>
			<ContentsForm addContents={addContents} />

			<Suspense fallback={<Loading />}>
				<ContentsStack getContents={getUnexportedContents} page={currentPage} />
			</Suspense>
		</>
	);
}
