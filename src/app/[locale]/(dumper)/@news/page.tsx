import { Suspense } from "react";
import { addNews } from "@/application-services/news/add-news";
import { deleteNews } from "@/application-services/news/delete-news";
import {
	getCategories,
	getExportedNews,
	getNewsCount,
	getUnexportedNews,
} from "@/application-services/news/get-news";
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

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "news") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
				return (
					<>
						<Suspense
							fallback={
								<div className="h-8 animate-pulse bg-gray-100 rounded" />
							}
						>
							<ErrorPermissionBoundary
								errorCaller="NewsCounter"
								permissionCheck={hasViewerAdminPermission}
								render={() => NewsCounter({ currentPage, getNewsCount })}
							/>
						</Suspense>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="NewsStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									NewsStack({ currentPage, getNews: getExportedNews })
								}
							/>
						</Suspense>
					</>
				);
			case "dumper":
			default:
				return (
					<>
						<Suspense
							fallback={
								<div className="h-32 animate-pulse bg-gray-100 rounded" />
							}
						>
							<ErrorPermissionBoundary
								errorCaller="NewsForm"
								permissionCheck={hasDumperPostPermission}
								render={() => NewsForm({ addNews, getCategories })}
							/>
						</Suspense>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="NewsStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									NewsStack({
										currentPage,
										getNews: getUnexportedNews,
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
		<LazyTabContent
			fallback={<div className="h-32 animate-pulse bg-gray-100" />}
			tabName="news"
		>
			{content}
		</LazyTabContent>
	);
}
