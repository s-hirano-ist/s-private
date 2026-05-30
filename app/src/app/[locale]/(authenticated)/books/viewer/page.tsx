import { loadMoreExportedBooks } from "@/application-services/books/load-more-books";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { BooksCounterLoader } from "@/loaders/books/books-counter-loader";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";

export default async function Page() {
	return (
		<>
			<ErrorBoundary
				errorCaller="BooksCounter"
				fallback={<div />}
				render={() => BooksCounterLoader({})}
			/>

			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="BooksStack"
					render={() =>
						BooksStackLoader({
							loadMoreAction: loadMoreExportedBooks,
							variant: "exported",
						})
					}
				/>
			</Suspense>
		</>
	);
}
