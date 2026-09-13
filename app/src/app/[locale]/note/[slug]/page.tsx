import type { Metadata } from "next";
import { getNoteByTitle } from "@/application-services/notes/get-notes";
import { requireAuth } from "@/common/auth/session";
import { PAGE_NAME } from "@/common/constants";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ViewerBody } from "@/components/notes/server/viewer-body";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/note/[slug]">): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private notes of ${slug}`,
	};
}

type NoteContentProps = Pick<PageProps<"/[locale]/note/[slug]">, "params">;

async function NoteContent({ params }: NoteContentProps) {
	await requireAuth();

	const { slug } = await params;

	return (
		<ErrorBoundary
			errorCaller="NotesViewerBody"
			render={() => ViewerBody({ getNoteByTitle, slug })}
		/>
	);
}

export default function Page({ params }: PageProps<"/[locale]/note/[slug]">) {
	return (
		<Suspense fallback={<Loading />}>
			<NoteContent params={params} />
		</Suspense>
	);
}
