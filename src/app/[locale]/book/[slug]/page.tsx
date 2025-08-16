import type { Metadata } from "next";
import { getBookByISBN } from "@/application-services/books/get-books";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { PAGE_NAME } from "@/common/constants";
import { ViewerBody } from "@/components/books/server/viewer-body";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private book review of ${slug}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	const { slug } = await params;

	return (
		<ErrorPermissionBoundary
			errorCaller="BooksViewerBody"
			permissionCheck={hasViewerAdminPermission}
			render={() => ViewerBody({ getBookByISBN, slug })}
		/>
	);
}
