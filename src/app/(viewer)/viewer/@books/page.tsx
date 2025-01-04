import { Badge } from "@/components/ui/badge";
import { Unauthorized } from "@/components/unauthorized";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { ViewerStack } from "@/features/viewer/components/viewer-stack";
import prisma from "@/prisma";

const path = "books";

export const dynamic = "force-dynamic";

export default async function Page() {
	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	const images = await prisma.staticBooks.findMany({
		select: { title: true, unit8ArrayImage: true },
	});

	return (
		<>
			{hasAdminPermission ? (
				<>
					<Badge className="m-2 flex justify-center">
						冊数: {images.length}
					</Badge>
					<ViewerStack path={path} images={images} imageType="webp" />
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
