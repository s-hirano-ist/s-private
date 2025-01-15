import Loading from "@/components/loading";
import { Suspense } from "react";
import { SuspensePage } from "./_page";

export const dynamic = "force-dynamic";

export default async function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage />
		</Suspense>
	);
}
