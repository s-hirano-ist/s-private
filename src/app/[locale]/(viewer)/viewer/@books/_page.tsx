import { Unauthorized } from "@/components/card/unauthorized";
import { ViewerStack } from "@/components/stack/viewer-stack";
import { Badge } from "@/components/ui/badge";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";

const path = "books";

export async function SuspensePage() {
	const hasAdminPermission = await hasViewerAdminPermission();

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
