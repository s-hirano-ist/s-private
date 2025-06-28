import { Suspense } from "react";
import Loading from "@/components/loading";
import { SuspensePage } from "./_page";

type Props = {
	searchParams: { [key: string]: string | string[] | undefined };
};

export default async function Page({ searchParams }: Props) {
	const activeTab = searchParams.tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "image") {
		return <div />;
	}

	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage />
		</Suspense>
	);
}
