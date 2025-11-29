import { Suspense } from "react";
import Loading from "s-ui/display/loading";
import { addArticle } from "@/application-services/articles/add-article";
import { deleteArticle } from "@/application-services/articles/delete-article";
import {
	getCategories,
	getExportedArticles,
	getExportedArticlesCount,
	getUnexportedArticles,
} from "@/application-services/articles/get-articles";
import {
	loadMoreExportedArticles,
	loadMoreUnexportedArticles,
} from "@/application-services/articles/get-articles-from-client";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ArticleForm } from "@/components/articles/server/article-form";
import { ArticlesCounter } from "@/components/articles/server/articles-counter";
import { ArticlesStack } from "@/components/articles/server/articles-stack";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { LazyTabContent } from "@/components/common/lazy-tab-content";

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
							render={() =>
								ArticlesCounter({ getArticlesCount: getExportedArticlesCount })
							}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="ArticlesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ArticlesStack({
										getArticles: getExportedArticles,
										loadMoreAction: loadMoreExportedArticles,
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
							render={() => ArticleForm({ addArticle, getCategories })}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="ArticlesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ArticlesStack({
										getArticles: getUnexportedArticles,
										loadMoreAction: loadMoreUnexportedArticles,
										deleteArticle,
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
