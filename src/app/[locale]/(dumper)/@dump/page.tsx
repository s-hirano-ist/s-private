import { Suspense } from "react";
import Loading from "@/components/loading";
import { ChangeStatusForm } from "./_change-status-form/server";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "dump") {
		return <div />;
	}

	return (
		<Suspense fallback={<Loading />}>
			<ChangeStatusForm />
		</Suspense>
	);
}
