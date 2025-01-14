import { Unauthorized } from "@/components/card/unauthorized";
import { ViewerStack } from "@/components/stack/viewer-stack";
import { Badge } from "@/components/ui/badge";
import { hasViewerAdminPermission } from "@/features/auth/utils/role";
import prisma from "@/prisma";

const path = "books";

export const dynamic = "force-dynamic";

export default async function Page() {
	const hasAdminPermission = await hasViewerAdminPermission();

	// FIXME: use suspense for load
	const totalImages = await prisma.staticBooks.count({});

	const images = await prisma.staticBooks.findMany({
		select: { title: true, uint8ArrayImage: true },
		cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
	});

	return (
		<>
			{hasAdminPermission ? (
				<>
					<Badge className="m-2 flex justify-center">冊数: {totalImages}</Badge>
					<ViewerStack path={path} images={images} imageType="webp" />
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
