import { ViewerBody } from "@/components/body/viewer-body";
import { NotFound } from "@/components/card/not-found";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";

type Props = { slug: string };

export async function SuspensePage({ slug }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();

	const decordedSlug = decodeURIComponent(slug);

	const data = await prisma.staticBooks.findUnique({
		where: { title: decordedSlug },
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
