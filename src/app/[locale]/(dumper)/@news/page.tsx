import { Suspense } from "react";
import { AddFormSkeleton } from "@/components/add-form-skeleton";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { AddNewsForm } from "./_add-news-form/server";
import { NewsStack } from "./_news-stack/server";

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
			<AddNewsForm />

			<Separator className="h-px bg-linear-to-r from-primary-grad-from to-primary-grad-to" />

			<Suspense fallback={<CardStackSkeleton />}>
				<NewsStack />
			</Suspense>
		</>
	);
}
