import { Unauthorized } from "@/components/card/unauthorized";
import { ViewerStack } from "@/components/stack/viewer-stack";
import { Badge } from "@/components/ui/badge";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";

const path = "contents";

export async function SuspensePage() {
	const hasAdminPermission = await hasViewerAdminPermission();

	// FIXME: use suspense for load
	const totalImages = await prisma.staticContents.count({});

	const images = await prisma.staticContents.findMany({
		select: { title: true, uint8ArrayImage: true },
		cacheStrategy: { ttl: 400, tags: ["staticContents"] },
	});

	return (
		<>
			{hasAdminPermission ? (
				<>
					<Badge className="m-2 flex justify-center">
						コンテンツ数: {totalImages}
					</Badge>
					<ViewerStack path={path} images={images} imageType="svg" />
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
