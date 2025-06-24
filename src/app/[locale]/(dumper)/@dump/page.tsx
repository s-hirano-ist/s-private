import { Suspense } from "react";
import Loading from "@/components/loading";
import { SuspensePage } from "./_page";

export default async function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage />
		</Suspense>
	);
}
