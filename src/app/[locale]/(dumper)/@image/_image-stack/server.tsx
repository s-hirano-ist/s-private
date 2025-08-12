import { StatusCodeView } from "@/components/status/status-code-view";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { getSelfId } from "@/utils/auth/session";
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
