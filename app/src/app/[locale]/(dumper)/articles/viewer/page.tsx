import { loadMoreExportedArticles } from "@/application-services/articles/load-more-articles";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ArticlesCounterLoader } from "@/loaders/articles/articles-counter-loader";
import { ArticlesStackLoader } from "@/loaders/articles/articles-stack-loader";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";

export default async function Page() {
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
}
