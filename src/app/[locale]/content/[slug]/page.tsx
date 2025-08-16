import type { Metadata } from "next";
import { getContentByTitle } from "@/application-services/contents/get-contents";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { PAGE_NAME } from "@/common/constants";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ViewerBody } from "@/components/contents/server/viewer-body";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private contents of ${slug}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	const { slug } = await params;

	return (
		<ErrorPermissionBoundary
			errorCaller="ContentsViewerBody"
			permissionCheck={hasViewerAdminPermission}
			render={() => ViewerBody({ getContentByTitle, slug })}
		/>
	);
}
