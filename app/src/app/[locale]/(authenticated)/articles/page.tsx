import { addArticle } from "@/application-services/articles/add-article";
import { deleteArticle } from "@/application-services/articles/delete-article";
import { loadMoreUnexportedArticles } from "@/application-services/articles/load-more-articles";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ArticleFormLoader } from "@/loaders/articles/article-form-loader";
import { ArticlesStackLoader } from "@/loaders/articles/articles-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export default function Page() {
	return (
		<>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="ArticleForm"
					render={() => ArticleFormLoader({ addArticle })}
				/>
			</Suspense>

			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="ArticlesStack"
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
