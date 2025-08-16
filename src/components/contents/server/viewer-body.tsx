import { notFound } from "next/navigation";
import type { getContentByTitle } from "@/application-services/contents/get-contents";
import { ViewerBodyClient } from "@/components/common/layouts/body/viewer-body";

type Props = { slug: string; getContentByTitle: typeof getContentByTitle };

export async function ViewerBody({ slug, getContentByTitle }: Props) {
	const decodedSlug = decodeURIComponent(slug);
	const markdown = await getContentByTitle(decodedSlug);

	if (!markdown) notFound();

	return <ViewerBodyClient markdown={markdown} />;
}
