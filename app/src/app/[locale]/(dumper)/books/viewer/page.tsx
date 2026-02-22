import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { loadMoreExportedBooks } from "@/application-services/books/load-more-books";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { BooksCounterLoader } from "@/loaders/books/books-counter-loader";
import { BooksStackLoader } from "@/loaders/books/books-stack-loader";

export default async function Page() {
	return (
		<>
			<ErrorPermissionBoundary
				errorCaller="BooksCounter"
				fallback={<div />}
				permissionCheck={hasViewerAdminPermission}
				render={() => BooksCounterLoader({})}
			/>

			<Suspense fallback={<Loading />}>
				<ErrorPermissionBoundary
					errorCaller="BooksStack"
					permissionCheck={hasViewerAdminPermission}
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
