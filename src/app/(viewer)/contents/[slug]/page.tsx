import { NotFound } from "@/components/not-found";
import { Unauthorized } from "@/components/unauthorized";
import { PAGE_NAME } from "@/constants";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { ViewerBody } from "@/features/viewer/components/viewer-body";
// import { markdownToReact } from "@/features/viewer/utils/markdown-to-react";
import prisma from "@/prisma";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function generateMetadata({
	params,
}: { params: Params }): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private contents of ${slug}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	const { slug } = await params;

	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	const data = await prisma.staticContents.findUnique({
		where: { title: slug },
		select: { markdown: true },
	});
	if (!data) return <NotFound />;

	// const reactData = await markdownToReact(data.markdown);
	return (
		<>
			{hasAdminPermission ? (
				<ViewerBody>{data.markdown}</ViewerBody>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
