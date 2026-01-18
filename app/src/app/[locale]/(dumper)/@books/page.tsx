import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { addBooks } from "@/application-services/books/add-books";
import { deleteBooks } from "@/application-services/books/delete-books";
import {
	loadMoreExportedBooks,
	loadMoreUnexportedBooks,
} from "@/application-services/books/load-more-books";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { LazyTabContent } from "@/components/common/lazy-tab-content";
import {
	BooksCounterLoader,
	BooksFormLoader,
	BooksStackLoader,
} from "@/loaders/books";

type Params = Promise<{ tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { tab, layout } = await searchParams;

	// Only render if this tab is active
	if (tab && tab !== "books") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
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
			default:
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
	})();

	return (
		<LazyTabContent fallback={<Loading />} tabName="books">
			{content}
		</LazyTabContent>
	);
}
