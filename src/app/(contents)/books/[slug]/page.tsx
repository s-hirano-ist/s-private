import { Unauthorized } from "@/components/unauthorized";
import { PAGE_NAME } from "@/constants";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { getAllSlugs } from "@/features/markdown/actions/fetch-contents";
import { ContentBody } from "@/features/markdown/components/content-body";
import type { Metadata } from "next";

const path = "books";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export async function generateMetadata({
	params,
}: { params: Params }): Promise<Metadata> {
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

	const { default: Contents } = await import(
		`../../../../../s-contents/markdown/books/${decordedSlug}`
	);

	return (
		<>
			{hasAdminPermission ? (
				<ContentBody>
					<Contents />
				</ContentBody>
			) : (
				<Unauthorized />
			)}
		</>
	);
}

export function generateStaticParams() {
	return getAllSlugs(path).map((slug) => {
		return { slug: decodeURIComponent(slug) };
	});
}
