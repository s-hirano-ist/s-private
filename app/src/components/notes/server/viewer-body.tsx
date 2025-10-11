import { notFound } from "next/navigation";
import { ViewerBodyClient } from "s-private-components/layouts/body/viewer-body";
import type { getNoteByTitle } from "@/application-services/notes/get-notes";

export type Props = {
	slug: string;
	getNoteByTitle: typeof getNoteByTitle;
};

export async function ViewerBody({ slug, getNoteByTitle }: Props) {
	const decodedSlug = decodeURIComponent(slug);
	const data = await getNoteByTitle(decodedSlug);

	if (!data) notFound();

	return <ViewerBodyClient markdown={data.markdown} />;
}
