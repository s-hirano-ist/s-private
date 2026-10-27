import { deleteBooks } from "@/application-services/books/delete-books";
import { loadMoreUnexportedBooks } from "@/application-services/books/load-more-books";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";

export default function Page() {
	return renderContentListPage({
		stack: {
			errorCaller: "BooksStack",
			render: () =>
				BooksStackLoader({
					deleteAction: deleteBooks,
					loadMoreAction: loadMoreUnexportedBooks,
					variant: "unexported",
				}),
		},
	});
}
