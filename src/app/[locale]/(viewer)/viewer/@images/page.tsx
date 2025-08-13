import { Suspense } from "react";
import { ImageStackSkeleton } from "@/components/image/image-stack-skeleton";
import { ImageCounter } from "./_image-counter/server";
import { ImageStack } from "./_image-stack/server";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;
	const currentPage = Number(page) || 1;
	const activeTab = tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "images") {
		return <div />;
	}

	return (
		<>
			<Suspense>
				<ImageCounter page={currentPage} />
			</Suspense>

			<Suspense fallback={<ImageStackSkeleton />} key={currentPage}>
				<ImageStack page={currentPage} />
			</Suspense>
		</>
	);
}
