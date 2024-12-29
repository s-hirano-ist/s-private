import { Unauthorized } from "@/components/unauthorized";
import { MARKDOWN_PATHS, PAGE_NAME } from "@/constants";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import {
	/*getAllSlugs,*/ getContentsBySlug,
} from "@/features/markdown/actions/fetch-contents";
import { ContentBody } from "@/features/markdown/components/content-body";
import type { ContentsType } from "@/features/markdown/types";
import { markdownToReact } from "@/features/markdown/utils/markdownToReact";
import type { Metadata } from "next";

const path = "books";

export const dynamicParams = true; // FIXME: #278

type Params = Promise<ContentsType>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${decodeURIComponent(slug)} | ${PAGE_NAME}`,
		description: `Private book review of ${decodeURIComponent(slug)}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	const { slug } = await params;

	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	const decordedSlug = decodeURIComponent(slug);
	const content = getContentsBySlug(decordedSlug, `${MARKDOWN_PATHS}/${path}`);
	const reactContent = await markdownToReact(content);

	return (
		<>
			{hasAdminPermission ? (
				<ContentBody content={reactContent} />
			) : (
				<Unauthorized />
			)}
		</>
	);
}

// export function generateStaticParams() {
// 	return getAllSlugs(path);
// }
