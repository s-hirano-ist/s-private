import { ViewerBody } from "@/components/body/viewer-body";
import { NotFound } from "@/components/card/not-found";
import { Unauthorized } from "@/components/card/unauthorized";
import { PAGE_NAME } from "@/constants";
import { hasViewerAdminPermission } from "@/features/auth/utils/role";
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
		title: `${slug} | ${PAGE_NAME}`,
		description: `Private contents of ${slug}`,
	};
}

export default async function Page({ params }: { params: Params }) {
	const { slug } = await params;

	const hasAdminPermission = await hasViewerAdminPermission();

	const data = await prisma.staticContents.findUnique({
		where: { title: slug },
		select: { markdown: true },
	});
	if (!data) return <NotFound />;

	const reactData = await markdownToReact(data.markdown);
	return (
		<>
			{hasAdminPermission ? (
				<ViewerBody>
					<ViewerBody>{reactData}</ViewerBody>
				</ViewerBody>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
