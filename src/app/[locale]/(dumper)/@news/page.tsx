import { Suspense } from "react";
import { addNews } from "@/application-services/news/add-news";
import { deleteNews } from "@/application-services/news/delete-news";
import {
	getCategories,
	getExportedNews,
	getExportedNewsCount,
	getUnexportedNews,
} from "@/application-services/news/get-news";
import {
	loadMoreExportedNews,
	loadMoreUnexportedNews,
} from "@/application-services/news/get-news-from-client";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import Loading from "@/components/common/display/loading";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { LazyTabContent } from "@/components/common/layouts/lazy-tab-content";
import { NewsCounter } from "@/components/news/server/news-counter";
import { NewsForm } from "@/components/news/server/news-form";
import { NewsStack } from "@/components/news/server/news-stack";

type Params = Promise<{ tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { tab, layout } = await searchParams;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "news") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
				return (
					<>
						<ErrorPermissionBoundary
							errorCaller="NewsCounter"
							permissionCheck={hasViewerAdminPermission}
							render={() => NewsCounter({ getNewsCount: getExportedNewsCount })}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="NewsStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									NewsStack({
										getNews: getExportedNews,
										loadMoreAction: loadMoreExportedNews,
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
							errorCaller="NewsForm"
							permissionCheck={hasDumperPostPermission}
							render={() => NewsForm({ addNews, getCategories })}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="NewsStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									NewsStack({
										getNews: getUnexportedNews,
										loadMoreAction: loadMoreUnexportedNews,
										deleteNews,
									})
								}
							/>
						</Suspense>
					</>
				);
		}
	})();

	return (
		<LazyTabContent fallback={<Loading />} tabName="news">
			{content}
		</LazyTabContent>
	);
}
