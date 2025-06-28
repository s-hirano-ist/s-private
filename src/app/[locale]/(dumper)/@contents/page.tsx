import { Suspense } from "react";
import Loading from "@/components/loading";
import { SuspensePage } from "./_page";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (activeTab && activeTab !== "contents") {
		return <div />;
	}

	return (
		<Suspense fallback={<Loading />}>
			<SuspensePage />
		</Suspense>
	);
}
