import { StatusCodeView } from "@/components/card/status-code-view";
import { ImageStack as ImageStackComponent } from "@/components/stack/image-stack";
import { getSelfId } from "@/features/auth/utils/session";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

export async function ImageStack() {
	try {
		const userId = await getSelfId();

		const images = await prisma.images.findMany({
			where: { userId, status: "UNEXPORTED" },
			select: { id: true, width: true, height: true },
			orderBy: { id: "desc" },
		});

		return <ImageStackComponent data={images} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ImagePage", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
