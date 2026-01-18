import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { addArticle } from "@/application-services/articles/add-article";
import { deleteArticle } from "@/application-services/articles/delete-article";
import {
	loadMoreExportedArticles,
	loadMoreUnexportedArticles,
} from "@/application-services/articles/get-articles-from-client";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { LazyTabContent } from "@/components/common/lazy-tab-content";
import {
	ArticleFormLoader,
	ArticlesCounterLoader,
	ArticlesStackLoader,
} from "@/loaders/articles";

type Params = Promise<{ tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { tab, layout } = await searchParams;

	// Only render if this tab is active or no tab is specified
	if (tab && tab !== "articles") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
				return (
					<>
						<ErrorPermissionBoundary
							errorCaller="ArticlesCounter"
							fallback={<div />}
							permissionCheck={hasViewerAdminPermission}
							render={() => ArticlesCounterLoader({})}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="ArticlesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ArticlesStackLoader({
										loadMoreAction: loadMoreExportedArticles,
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
							errorCaller="ArticleForm"
							permissionCheck={hasDumperPostPermission}
							render={() => ArticleFormLoader({ addArticle })}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="ArticlesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ArticlesStackLoader({
										deleteAction: deleteArticle,
										loadMoreAction: loadMoreUnexportedArticles,
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
		<LazyTabContent fallback={<Loading />} tabName="articles">
			{content}
		</LazyTabContent>
	);
}
