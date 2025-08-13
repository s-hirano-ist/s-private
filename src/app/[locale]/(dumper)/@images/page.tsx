import { Suspense } from "react";
import { ImageStackSkeleton } from "@/components/image/image-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { AddImageForm } from "./_add-image-form/server";
import { ImageStack } from "./_image-stack/server";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active
	if (activeTab && activeTab !== "images") {
		return <div />;
	}

	return (
		<>
			<AddImageForm />
			<Separator className="h-px bg-linear-to-r from-primary-grad-from to-primary-grad-to" />
			<Suspense fallback={<ImageStackSkeleton />}>
				<ImageStack />
			</Suspense>
		</>
	);
}
