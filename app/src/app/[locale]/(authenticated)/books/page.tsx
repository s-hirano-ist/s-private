import { deleteBooks } from "@/application-services/books/delete-books";
import { loadMoreUnexportedBooks } from "@/application-services/books/load-more-books";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export default function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<ErrorBoundary
				errorCaller="BooksStack"
				render={() =>
					BooksStackLoader({
						deleteAction: deleteBooks,
						loadMoreAction: loadMoreUnexportedBooks,
						variant: "unexported",
					})
				}
			/>
		</Suspense>
	);
}
