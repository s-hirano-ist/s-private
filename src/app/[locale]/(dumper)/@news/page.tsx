import { Suspense } from "react";
import { NewsStack } from "@/app/[locale]/(dumper)/@news/_news-stack/server";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { AddFormSkeleton } from "@/features/dump/components/add-form-skeleton";
import { AddNewsForm } from "./_add-news-form/server";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: Props) {
	const activeTab = (await searchParams).tab as string;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (activeTab && activeTab !== "news") {
		return <div />;
	}

	return (
		<>
			<Suspense fallback={<AddFormSkeleton showCategory />}>
				<AddNewsForm />
			</Suspense>

			<Separator className="h-px bg-linear-to-r from-primary to-primary-grad" />

			<Suspense fallback={<CardStackSkeleton />}>
				<NewsStack />
			</Suspense>
		</>
	);
}
