import Loading from "@s-hirano-ist/s-ui/display/loading";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getNoteByTitle } from "@/application-services/notes/get-notes";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { PAGE_NAME } from "@/common/constants";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ViewerBody } from "@/components/notes/server/viewer-body";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private notes of ${slug}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	const { slug } = await params;

	return (
		<Suspense fallback={<Loading />}>
			<ErrorPermissionBoundary
				errorCaller="NotesViewerBody"
				permissionCheck={hasViewerAdminPermission}
				render={() => ViewerBody({ getNoteByTitle, slug })}
			/>
		</Suspense>
	);
}
