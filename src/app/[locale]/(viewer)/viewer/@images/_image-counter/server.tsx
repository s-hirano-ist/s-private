import { StatusCodeView } from "@/components/status/status-code-view";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { ImageCounterClient } from "./client";

type Props = { page: number };

export async function ImageCounter({ page }: Props) {
	try {
		const hasAdminPermission = await hasViewerAdminPermission();
		if (!hasAdminPermission) return <></>;

		const totalImages = await prisma.images.count({});
		return <ImageCounterClient page={page} totalImages={totalImages} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ImageCounter", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
