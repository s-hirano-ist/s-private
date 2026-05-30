import { addBooks } from "@/application-services/books/add-books";
import { deleteBooks } from "@/application-services/books/delete-books";
import { loadMoreUnexportedBooks } from "@/application-services/books/load-more-books";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { BooksFormLoader } from "@/loaders/books/books-form-loader";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";

export default async function Page() {
	return (
		<>
			<ErrorBoundary
				errorCaller="BooksForm"
				render={() => BooksFormLoader({ addBooks })}
			/>

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
		</>
	);
}
