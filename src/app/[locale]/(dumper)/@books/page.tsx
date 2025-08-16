import { Suspense } from "react";
import { addBooks } from "@/application-services/books/add-books";
import { deleteBooks } from "@/application-services/books/delete-books";
import {
	getBooksCount,
	getExportedBooks,
	getUnexportedBooks,
} from "@/application-services/books/get-books";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { BooksCounter } from "@/components/books/server/books-counter";
import { BooksForm } from "@/components/books/server/books-form";
import { BooksStack } from "@/components/books/server/books-stack";
import Loading from "@/components/common/display/loading";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active
	if (tab && tab !== "books") return <div />;

	switch (layout) {
		case "viewer":
			return (
				<>
					<Suspense fallback={<Loading />}>
						<ErrorPermissionBoundary
							errorCaller="BooksCounter"
							permissionCheck={hasViewerAdminPermission}
						>
							<BooksCounter
								currentPage={currentPage}
								getBooksCount={getBooksCount}
							/>
						</ErrorPermissionBoundary>
					</Suspense>

					<Suspense fallback={<Loading />}>
						<ErrorPermissionBoundary
							errorCaller="BooksStack"
							permissionCheck={hasViewerAdminPermission}
						>
							<BooksStack getBooks={getExportedBooks} />
						</ErrorPermissionBoundary>
					</Suspense>
				</>
			);
		case "dumper":
		default:
			return (
				<>
					<Suspense fallback={<Loading />}>
						<ErrorPermissionBoundary
							errorCaller="BooksForm"
							permissionCheck={hasDumperPostPermission}
						>
							<BooksForm addBooks={addBooks} />
						</ErrorPermissionBoundary>
					</Suspense>

					<Suspense fallback={<Loading />}>
						<ErrorPermissionBoundary
							errorCaller="BooksStack"
							permissionCheck={hasViewerAdminPermission}
						>
							<BooksStack
								deleteBooks={deleteBooks}
								getBooks={getUnexportedBooks}
							/>
						</ErrorPermissionBoundary>
					</Suspense>
				</>
			);
	}
}
