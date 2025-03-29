import { StatusCodeView } from "@/components/card/status-code-view";
import { ImageStack as ImageStackComponent } from "@/components/stack/image-stack";
import { NOT_FOUND_IMAGE_PATH } from "@/constants";
import { getSelfId } from "@/features/auth/utils/session";
import { generateUrl } from "@/features/image/actions/generate-url";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

export async function ImageStack() {
	try {
		const userId = await getSelfId();

		const _images = await prisma.images.findMany({
			where: { userId, status: "UNEXPORTED" },
			select: { id: true, width: true, height: true },
			orderBy: { id: "desc" },
		});

		const images = await Promise.all(
			_images.map(async (image) => {
				const response = await generateUrl(image.id);
				if (!response.success)
					return {
						thumbnailSrc: NOT_FOUND_IMAGE_PATH,
						originalSrc: NOT_FOUND_IMAGE_PATH,
					};

				return {
					thumbnailSrc: response.data.thumbnailSrc,
					originalSrc: response.data.originalSrc,
					width: image.width ?? undefined,
					height: image.height ?? undefined,
				};
			}),
		);

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
