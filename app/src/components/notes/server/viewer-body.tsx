import { ViewerBodyClient } from "@s-hirano-ist/s-ui/layouts/body/viewer-body";
import { notFound } from "next/navigation";
import type { getNoteByTitle } from "@/application-services/notes/get-notes";
import { BackButton } from "@/components/common/back-button";

export type Props = {
	slug: string;
	getNoteByTitle: typeof getNoteByTitle;
};

export async function ViewerBody({ slug, getNoteByTitle }: Props) {
	const decodedSlug = decodeURIComponent(slug);
	const data = await getNoteByTitle(decodedSlug);

	if (!data) notFound();

	return (
		<ViewerBodyClient markdown={data.markdown}>
			<BackButton />
		</ViewerBodyClient>
	);
}
