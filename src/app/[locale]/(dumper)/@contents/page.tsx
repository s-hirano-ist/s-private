import { Suspense } from "react";
import { addContent } from "@/application-services/contents/add-contents";
import { deleteContents } from "@/application-services/contents/delete-contents";
import {
	getExportedContents,
	getExportedContentsCount,
	getUnexportedContents,
} from "@/application-services/contents/get-contents";
import {
	loadMoreExportedContents,
	loadMoreUnexportedContents,
} from "@/application-services/contents/get-contents-from-client";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import Loading from "@/components/common/display/loading";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { LazyTabContent } from "@/components/common/layouts/lazy-tab-content";
import { ContentsCounter } from "@/components/contents/server/contents-counter";
import { ContentsForm } from "@/components/contents/server/contents-form";
import { ContentsStack } from "@/components/contents/server/contents-stack";

type Params = Promise<{ tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { tab, layout } = await searchParams;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "contents") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
				return (
					<>
						<ErrorPermissionBoundary
							errorCaller="NewsCounter"
							permissionCheck={hasViewerAdminPermission}
							render={() =>
								ContentsCounter({ getContentsCount: getExportedContentsCount })
							}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="ContentsStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ContentsStack({
										getContents: getExportedContents,
										loadMoreAction: loadMoreExportedContents,
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
							errorCaller="ContentsForm"
							permissionCheck={hasDumperPostPermission}
							render={() => ContentsForm({ addContents: addContent })}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="ContentsStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ContentsStack({
										getContents: getUnexportedContents,
										loadMoreAction: loadMoreUnexportedContents,
										deleteContents,
									})
								}
							/>
						</Suspense>
					</>
				);
		}
	})();

	return (
		<LazyTabContent fallback={<Loading />} tabName="contents">
			{content}
		</LazyTabContent>
	);
}
