import Loading from "@/components/loading";
import { Suspense } from "react";
import { SuspensePage } from "./_page";

export const dynamic = "force-dynamic";

type Params = Promise<{ page?: string }>;

export default async function Page({ params }: { params: Params }) {
	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage params={params} />
		</Suspense>
	);
}
