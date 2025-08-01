import { Suspense } from "react";
import { ImageStack } from "@/app/[locale]/(dumper)/@image/_image-stack/server";
import Loading from "@/components/loading";
import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { AddImageForm } from "./_add-image-form/server";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "image") {
		return <div />;
	}

	return (
		<>
			<Suspense fallback={<Loading />}>
				<AddImageForm />
			</Suspense>
			<Separator className="h-px bg-linear-to-r from-primary to-primary-grad" />
			<Suspense fallback={<ImageStackSkeleton />}>
				<ImageStack />
			</Suspense>
		</>
	);
}
