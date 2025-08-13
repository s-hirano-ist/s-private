import { Suspense } from "react";
import { ImageCardSkeletonStack } from "@/components/card/image-card-skeleton-stack";
import { Separator } from "@/components/ui/separator";
import { AddBooksForm } from "./_add-books-form/server";
import { BooksStack } from "./_books-stack/server";

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
		<>
			<AddBooksForm />

			<Separator className="h-px bg-linear-to-r from-primary-grad-from to-primary-grad-to" />

			<Suspense fallback={<ImageCardSkeletonStack />}>
				<BooksStack />
			</Suspense>
		</>
	);
}
