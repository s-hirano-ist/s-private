import type { Metadata } from "next";
import { getBookByISBN } from "@/application-services/books/get-books";
import { requireAuth } from "@/common/auth/session";
import { PAGE_NAME } from "@/common/constants";
import { ViewerBody } from "@/components/books/server/viewer-body";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private book review of ${slug}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	await requireAuth();

	const { slug } = await params;

	return (
		<Suspense fallback={<Loading />}>
			<ErrorBoundary
				errorCaller="BooksViewerBody"
				render={() => ViewerBody({ getBookByISBN, slug })}
			/>
		</Suspense>
	);
}
