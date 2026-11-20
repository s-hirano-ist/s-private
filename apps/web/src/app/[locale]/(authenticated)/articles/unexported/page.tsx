import { deleteArticle } from "@/application-services/articles/delete-article";
import { loadMoreUnexportedArticles } from "@/application-services/articles/load-more-articles";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { ArticlesStackLoader } from "@/loaders/articles/articles-stack-loader";

// Keep ordinary client navigations fresh for the same 60s as private content.
export const unstable_dynamicStaleTime = 60;

export default function Page() {
	return renderContentListPage({
		stack: {
			errorCaller: "ArticlesStack",
			render: () =>
				ArticlesStackLoader({
					deleteAction: deleteArticle,
					loadMoreAction: loadMoreUnexportedArticles,
					variant: "unexported",
				}),
		},
	});
}
