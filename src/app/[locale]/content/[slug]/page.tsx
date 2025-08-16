import type { Metadata } from "next";
import { getContentByTitle } from "@/application-services/contents/get-contents";
import { PAGE_NAME } from "@/common/constants";
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

	return <ViewerBody getContentByTitle={getContentByTitle} slug={slug} />;
}
