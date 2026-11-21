import { deleteBooks } from "@/application-services/books/delete-books";
import { loadMoreExportedBooks } from "@/application-services/books/load-more-books";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { BooksCounterLoader } from "@/loaders/books/books-counter-loader";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";

// Keep ordinary client navigations fresh for the same 60s as private content.
export const unstable_dynamicStaleTime = 60;

export default function Page() {
	return renderContentListPage({
		counter: {
			errorCaller: "BooksCounter",
			render: () => BooksCounterLoader({}),
		},
		stack: {
			errorCaller: "BooksStack",
			render: () =>
				BooksStackLoader({
					loadMoreAction: loadMoreExportedBooks,
					variant: "exported",
					deleteAction: deleteBooks,
				}),
		},
	});
}
