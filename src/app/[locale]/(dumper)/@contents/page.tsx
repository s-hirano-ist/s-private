import { Suspense } from "react";
import { addContents } from "@/application-services/contents/add-contents";
import { deleteContents } from "@/application-services/contents/delete-contents";
import {
	getContentsCount,
	getExportedContents,
	getUnexportedContents,
} from "@/application-services/contents/get-contents";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import Loading from "@/components/common/display/loading";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ContentsCounter } from "@/components/contents/server/contents-counter";
import { ContentsForm } from "@/components/contents/server/contents-form";
import { ContentsStack } from "@/components/contents/server/contents-stack";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "contents") return <div />;

	switch (layout) {
		case "viewer":
			return (
				<>
					<ErrorPermissionBoundary
						errorCaller="ContentsCounter"
						permissionCheck={hasViewerAdminPermission}
						render={() => ContentsCounter({ currentPage, getContentsCount })}
					/>

					<Suspense fallback={<Loading />}>
						<ErrorPermissionBoundary
							errorCaller="ContentsStack"
							permissionCheck={hasViewerAdminPermission}
							render={() =>
								ContentsStack({ getContents: getExportedContents, currentPage })
							}
						/>
					</Suspense>
				</>
			);
		case "dumper":
		default:
			return (
				<>
					<ErrorPermissionBoundary
						errorCaller="ContentsForm"
						permissionCheck={hasDumperPostPermission}
						render={() => ContentsForm({ addContents })}
					/>

					<Suspense fallback={<Loading />}>
						<ErrorPermissionBoundary
							errorCaller="ContentsStack"
							permissionCheck={hasViewerAdminPermission}
							render={() =>
								ContentsStack({
									deleteContents,
									getContents: getUnexportedContents,
									currentPage,
								})
							}
						/>
					</Suspense>
				</>
			);
	}
}
