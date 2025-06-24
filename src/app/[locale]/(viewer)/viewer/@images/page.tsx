import { Suspense } from "react";
import Loading from "@/components/loading";
import { SuspensePage } from "./_page";

type Params = Promise<{ page?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page } = await searchParams;
	const currentPage = Number(page) || 1;

	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage currentPage={currentPage} />
		</Suspense>
	);
}
