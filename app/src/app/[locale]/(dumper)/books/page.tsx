import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { addBooks } from "@/application-services/books/add-books";
import { deleteBooks } from "@/application-services/books/delete-books";
import { loadMoreUnexportedBooks } from "@/application-services/books/load-more-books";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { BooksFormLoader } from "@/loaders/books/books-form-loader";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";

export default async function Page() {
	return (
		<>
			<ErrorPermissionBoundary
				errorCaller="BooksForm"
				permissionCheck={hasDumperPostPermission}
				render={() => BooksFormLoader({ addBooks })}
			/>

			<Suspense fallback={<Loading />}>
				<ErrorPermissionBoundary
					errorCaller="BooksStack"
					permissionCheck={hasViewerAdminPermission}
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
