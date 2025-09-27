import { notFound } from "next/navigation";
import type { getNoteByTitle } from "@/application-services/notes/get-notes";
import { ViewerBodyClient } from "@/components/common/layouts/body/viewer-body";

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
