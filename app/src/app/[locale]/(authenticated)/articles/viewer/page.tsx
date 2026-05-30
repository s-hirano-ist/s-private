import { loadMoreExportedArticles } from "@/application-services/articles/load-more-articles";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ArticlesCounterLoader } from "@/loaders/articles/articles-counter-loader";
import { ArticlesStackLoader } from "@/loaders/articles/articles-stack-loader";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";

export default async function Page() {
	return (
		<>
			<ErrorBoundary
				errorCaller="ArticlesCounter"
				fallback={<div />}
				render={() => ArticlesCounterLoader({})}
			/>

			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="ArticlesStack"
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
}
