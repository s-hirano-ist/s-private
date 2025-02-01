import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { ViewerStack } from "@/components/stack/viewer-stack";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";

const path = "contents";

export async function SuspensePage() {
	const hasAdminPermission = await hasViewerAdminPermission();

	const totalImages = await prisma.staticContents.count({});

	const images = await prisma.staticContents.findMany({
		select: { title: true, uint8ArrayImage: true },
		cacheStrategy: { ttl: 400, tags: ["staticContents"] },
	});

	return (
		<>
			{hasAdminPermission ? (
				<>
					<CountBadge label="totalContents" total={totalImages} />
					<ViewerStack path={path} images={images} imageType="svg" />
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
