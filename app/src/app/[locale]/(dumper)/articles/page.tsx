import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { addArticle } from "@/application-services/articles/add-article";
import { deleteArticle } from "@/application-services/articles/delete-article";
import {
	loadMoreExportedArticles,
	loadMoreUnexportedArticles,
} from "@/application-services/articles/load-more-articles";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ArticleFormLoader } from "@/loaders/articles/article-form-loader";
import { ArticlesCounterLoader } from "@/loaders/articles/articles-counter-loader";
import { ArticlesStackLoader } from "@/loaders/articles/articles-stack-loader";

type Params = Promise<{ layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { layout } = await searchParams;

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
}
