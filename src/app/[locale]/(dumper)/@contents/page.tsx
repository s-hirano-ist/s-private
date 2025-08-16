import { Suspense } from "react";
import { addContents } from "@/application-services/contents/add-contents";
import { deleteContents } from "@/application-services/contents/delete-contents";
import {
	getContentsCount,
	getExportedContents,
	getUnexportedContents,
} from "@/application-services/contents/get-contents";
import Loading from "@/components/common/display/loading";
import { ContentsCounter } from "@/components/contents/server/contents-counter";
import { ContentsForm } from "@/components/contents/server/contents-form";
import { ContentsStack } from "@/components/contents/server/contents-stack";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "contents") return <div />;

	switch (layout) {
		case "viewer":
			return (
				<>
					<ContentsCounter
						currentPage={currentPage}
						getContentsCount={getContentsCount}
					/>

					<Suspense fallback={<Loading />}>
						<ContentsStack
							getContents={getExportedContents}
							page={currentPage}
						/>
					</Suspense>
				</>
			);
		case "dumper":
		default:
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
}
