import type { Metadata } from "next";
import { getBookByISBN } from "@/application-services/books/get-books";
import { requireAuth } from "@/common/auth/session";
import { PAGE_NAME } from "@/common/constants";
import { ViewerBody } from "@/components/books/server/viewer-body";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/book/[slug]">): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private book review of ${slug}`,
	};
}

type BookContentProps = Pick<PageProps<"/[locale]/book/[slug]">, "params">;

async function BookContent({ params }: BookContentProps) {
	await requireAuth();

	const { slug } = await params;

	return (
		<ErrorBoundary
			errorCaller="BooksViewerBody"
			render={() => ViewerBody({ getBookByISBN, slug })}
		/>
	);
}

export default function Page({ params }: PageProps<"/[locale]/book/[slug]">) {
	return (
		<Suspense fallback={<Loading />}>
			<BookContent params={params} />
		</Suspense>
	);
}
