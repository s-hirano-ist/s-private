import { loadMoreExportedBooks } from "@/application-services/books/load-more-books";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { BooksCounterLoader } from "@/loaders/books/books-counter-loader";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export default function Page() {
	return (
		<>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="BooksCounter"
					fallback={<div />}
					render={() => BooksCounterLoader({})}
				/>
			</Suspense>

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
