import { StatusCodeView } from "@/components/card/status-code-view";
import { ImageStack as _ImageStack } from "@/components/stack/image-stack";
import { ERROR_MESSAGES } from "@/constants";
import { getUserId } from "@/features/auth/utils/get-session";
import { generateUrlWithMetadata } from "@/features/image/actions/generate-url-with-metadata";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

export async function ImageStack() {
	try {
		const userId = await getUserId();

		const _images = await prisma.images.findMany({
			where: { userId, status: "UNEXPORTED" },
			select: {
				id: true,
			},
			orderBy: { id: "desc" },
		});

		const images = await Promise.all(
			_images.map(async (image) => {
				const response = await generateUrlWithMetadata(image.id);
				if (!response.success) return { src: "/not-found.png" };

				return {
					src: response.data.url,
					width: response.data.metadata.width,
					height: response.data.metadata.height,
				};
			}),
		);

		return <_ImageStack data={images} />;
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
