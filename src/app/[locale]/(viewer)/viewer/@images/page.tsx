import Loading from "@/components/loading";
import { Suspense } from "react";
import { SuspensePage } from "./_page";

type Parameters_ = Promise<{ page?: string }>;

export default async function Page({ searchParams }: { searchParams: Parameters_ }) {
	const { page } = await searchParams;
	const currentPage = Number(page) || 1;

	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage currentPage={currentPage} />
		</Suspense>
	);
}
