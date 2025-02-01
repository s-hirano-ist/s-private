import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { ViewerStack } from "@/components/stack/viewer-stack";
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
					<CountBadge label="totalBooks" total={totalImages} />
					<ViewerStack path={path} images={images} imageType="webp" />
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
