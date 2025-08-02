import { StatusCodeView } from "@/components/card/status-code-view";
import { getSelfId } from "@/features/auth/utils/session";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { ImageStackClient } from "./client";

export async function ImageStack() {
	try {
		const userId = await getSelfId();

		const images = await prisma.images.findMany({
			where: { userId, status: "UNEXPORTED" },
			select: { id: true, width: true, height: true },
			orderBy: { id: "desc" },
		});

		return <ImageStackClient images={images} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ImageStack", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
