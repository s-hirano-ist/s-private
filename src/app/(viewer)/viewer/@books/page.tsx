import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { Badge } from "@/components/ui/badge";
import { ERROR_MESSAGES } from "@/constants";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { ViewerStack } from "@/features/viewer/components/viewer-stack";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

const path = "books";

export const dynamic = "force-dynamic";

export default async function Page() {
	try {
		await checkSelfAuthOrRedirectToAuth();

		const hasAdminPermission = await hasContentsPermission();

		const images = await prisma.staticBooks.findMany({
			select: { title: true, uint8ArrayImage: true },
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
	} catch (error) {
		loggerError(
			ERROR_MESSAGES.UNEXPECTED,
			{
				caller: "ImagePage",
				status: 500,
			},
			error,
		);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
