import { Header } from "@/components/nav/header";
import { Unauthorized } from "@/components/unauthorized";
import { MARKDOWN_PATHS, PAGE_NAME } from "@/constants";
import { checkAdminPermission } from "@/features/auth/lib/role";
import { ContentsBody } from "@/features/contents/components/contents-body";
import type ContentsType from "@/features/contents/types/contents";
import { getAllSlugs, getContentsBySlug } from "@/features/contents/utils/api";
import { markdownToReact } from "@/features/contents/utils/markdownToReact";
import type { Metadata } from "next";

const path = "books";

export const dynamicParams = true; // FIXME: #278

type Props = { params: ContentsType };

export function generateMetadata({ params }: Props): Metadata {
	return {
		title: `${decodeURIComponent(params.slug)} | ${PAGE_NAME}`,
		description: `Private book review of ${decodeURIComponent(params.slug)}`,
	};
}

export default async function Page({ params }: Props) {
	const hasAdminPermission = await checkAdminPermission();

	const { slug } = params;
	const decordedSlug = decodeURIComponent(slug);
	const content = getContentsBySlug(decordedSlug, `${MARKDOWN_PATHS}/${path}`);
	const reactContent = await markdownToReact(content);

	return (
		<>
			<Header title={decordedSlug} />
			{hasAdminPermission ? (
				<ContentsBody content={reactContent} />
			) : (
				<Unauthorized />
			)}
		</>
	);
}

export function generateStaticParams() {
	return getAllSlugs(path);
}
