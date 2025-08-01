import { Suspense } from "react";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";
import { AddContentsForm } from "./_add-contents-form/server";
import { ContentsStack } from "./_contents-stack/server";

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
		<>
			<Suspense fallback={<AddFormSkeleton />}>
				<AddContentsForm />
			</Suspense>

			<Separator className="h-px bg-linear-to-r from-primary to-primary-grad" />

			<Suspense fallback={<CardStackSkeleton />}>
				<ContentsStack />
			</Suspense>
		</>
	);
}
