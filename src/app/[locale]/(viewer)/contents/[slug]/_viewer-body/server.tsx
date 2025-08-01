import { ViewerBodyClient } from "@/components/body/viewer-body";
import { NotFound } from "@/components/card/not-found";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";

type Props = { slug: string };

export async function ViewerBody({ slug }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) return <Unauthorized />;

	const data = await prisma.staticContents.findUnique({
		where: { title: slug },
		select: { markdown: true },
		cacheStrategy: { ttl: 400, tags: ["staticContents"] },
	});
	if (!data) return <NotFound />;

	return <ViewerBodyClient markdown={data.markdown} />;
}
