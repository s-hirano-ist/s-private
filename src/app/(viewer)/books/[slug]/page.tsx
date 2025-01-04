import { NotFound } from "@/components/not-found";
import { Unauthorized } from "@/components/unauthorized";
import { PAGE_NAME } from "@/constants";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { ViewerBody } from "@/features/viewer/components/viewer-body";
import { markdownToReact } from "@/features/viewer/utils/markdown-to-react";
import prisma from "@/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

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

	const data = await prisma.staticBooks.findUnique({
		where: { title: decordedSlug },
		select: { markdown: true },
	});
	if (!data) return <NotFound />;

	const reactData = await markdownToReact(data.markdown);

	return (
		<>
			{hasAdminPermission ? (
				<ViewerBody>{reactData}</ViewerBody>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
