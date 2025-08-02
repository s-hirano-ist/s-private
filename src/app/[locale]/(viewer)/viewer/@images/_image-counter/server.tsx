import { StatusCodeView } from "@/components/card/status-code-view";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { ImageCounterClient } from "./client";

type Props = { page: number };

export async function ImageCounter({ page }: Props) {
	try {
		const hasAdminPermission = await hasViewerAdminPermission();
		if (!hasAdminPermission) return <></>;

		const totalImages = await prisma.staticImages.count({});
		return <ImageCounterClient page={page} totalImages={totalImages} />;
	} catch (error) {
		loggerError(
			"unexpected",
			{
				caller: "ImageCounter",
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
