import { Unauthorized } from "@/components/unauthorized";
import { PAGE_NAME } from "@/constants";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { getAllSlugs } from "@/features/viewer/actions/fetch-contents";
import { ContentBody } from "@/features/viewer/components/content-body";
import type { Metadata } from "next";

const path = "notes";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export async function generateMetadata({
	params,
}: { params: Params }): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private notes of ${slug}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	const { slug } = await params;

	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	const { default: Contents } = await import(
		`../../../../../s-contents/markdown/notes/${slug}`
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
		return { slug };
	});
}
