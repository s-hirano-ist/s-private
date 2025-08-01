import { Suspense } from "react";
import Loading from "@/components/loading";
import { PreviewStack } from "./_preview-stack/server";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "books") {
		return <div />;
	}

	return (
		<Suspense fallback={<Loading />}>
			<PreviewStack />
		</Suspense>
	);
}
