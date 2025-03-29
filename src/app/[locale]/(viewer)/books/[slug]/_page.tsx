import { ViewerBody } from "@/components/body/viewer-body";
import { NotFound } from "@/components/card/not-found";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";

type Properties = { slug: string };

export async function SuspensePage({ slug }: Properties) {
	const hasAdminPermission = await hasViewerAdminPermission();

	const decodedSlug = decodeURIComponent(slug);

	const data = await prisma.staticBooks.findUnique({
		where: { title: decodedSlug },
		select: { markdown: true },
		cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
	});
	if (!data) return <NotFound />;

	return (
		<>
			{hasAdminPermission ? (
				<ViewerBody markdown={data.markdown} />
			) : (
				<Unauthorized />
			)}
		</>
	);
}
