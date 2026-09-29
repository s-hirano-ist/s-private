import { loadMoreExportedBooks } from "@/application-services/books/load-more-books";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { BooksCounterLoader } from "@/loaders/books/books-counter-loader";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";

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
				}),
		},
	});
}
