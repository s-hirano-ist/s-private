import { Suspense } from "react";
import { addContents } from "@/applications/contents/add-contents";
import { deleteContents } from "@/applications/contents/delete-contents";
import { getUnexportedContents } from "@/applications/contents/get-contents";
import Loading from "@/common/components/loading";
import { ContentsForm } from "@/features/contents/server/contents-form";
import { ContentsStack } from "@/features/contents/server/contents-stack";

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
				<ContentsStack
					deleteContents={deleteContents}
					getContents={getUnexportedContents}
					page={currentPage}
				/>
			</Suspense>
		</>
	);
}
