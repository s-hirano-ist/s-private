import { loadMoreExportedArticles } from "@/application-services/articles/load-more-articles";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { ArticlesCounterLoader } from "@/loaders/articles/articles-counter-loader";
import { ArticlesStackLoader } from "@/loaders/articles/articles-stack-loader";

export default function Page() {
	return renderContentListPage({
		counter: {
			errorCaller: "ArticlesCounter",
			render: () => ArticlesCounterLoader({}),
		},
		stack: {
			errorCaller: "ArticlesStack",
			render: () =>
				ArticlesStackLoader({
					loadMoreAction: loadMoreExportedArticles,
					variant: "exported",
				}),
		},
	});
}
