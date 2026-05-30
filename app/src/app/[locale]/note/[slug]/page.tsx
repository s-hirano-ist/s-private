import type { Metadata } from "next";
import { getNoteByTitle } from "@/application-services/notes/get-notes";
import { requireAuth } from "@/common/auth/session";
import { PAGE_NAME } from "@/common/constants";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ViewerBody } from "@/components/notes/server/viewer-body";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";

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
	await requireAuth();

	const { slug } = await params;

	return (
		<Suspense fallback={<Loading />}>
			<ErrorBoundary
				errorCaller="NotesViewerBody"
				render={() => ViewerBody({ getNoteByTitle, slug })}
			/>
		</Suspense>
	);
}
