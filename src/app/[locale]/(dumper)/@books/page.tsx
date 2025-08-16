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
import { LazyTabContent } from "@/components/common/layouts/lazy-tab-content";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active
	if (tab && tab !== "books") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
				return (
					<>
						<Suspense
							fallback={
								<div className="h-8 animate-pulse bg-gray-100 rounded" />
							}
						>
							<ErrorPermissionBoundary
								errorCaller="BooksCounter"
								permissionCheck={hasViewerAdminPermission}
								render={() => BooksCounter({ currentPage, getBooksCount })}
							/>
						</Suspense>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="BooksStack"
								permissionCheck={hasViewerAdminPermission}
								render={() => BooksStack({ getBooks: getExportedBooks })}
							/>
						</Suspense>
					</>
				);
			case "dumper":
			default:
				return (
					<>
						<Suspense
							fallback={
								<div className="h-32 animate-pulse bg-gray-100 rounded" />
							}
						>
							<ErrorPermissionBoundary
								errorCaller="BooksForm"
								permissionCheck={hasDumperPostPermission}
								render={() => BooksForm({ addBooks })}
							/>
						</Suspense>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="BooksStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									BooksStack({ deleteBooks, getBooks: getUnexportedBooks })
								}
							/>
						</Suspense>
					</>
				);
		}
	})();

	return (
		<LazyTabContent
			fallback={<div className="h-32 animate-pulse bg-gray-100" />}
			tabName="books"
		>
			{content}
		</LazyTabContent>
	);
}
