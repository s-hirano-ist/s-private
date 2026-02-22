import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { addArticle } from "@/application-services/articles/add-article";
import { deleteArticle } from "@/application-services/articles/delete-article";
import { loadMoreUnexportedArticles } from "@/application-services/articles/load-more-articles";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ArticleFormLoader } from "@/loaders/articles/article-form-loader";
import { ArticlesStackLoader } from "@/loaders/articles/articles-stack-loader";

export default async function Page() {
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
