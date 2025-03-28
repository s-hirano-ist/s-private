import { StatusCodeView } from "@/components/card/status-code-view";
import { ImageStack } from "@/components/stack/image-stack";
import { NOT_FOUND_IMAGE_PATH, PAGE_SIZE } from "@/constants";
import { generateUrl } from "@/features/image/actions/generate-url";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

type Props = { page: number };

export async function AllImageStack({ page }: Props) {
	try {
		const _images = await prisma.staticImages.findMany({
			select: { id: true, width: true, height: true },
			orderBy: { id: "desc" },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			cacheStrategy: { ttl: 400, swr: 40, tags: ["staticImages"] },
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

		return <ImageStack data={images} />;
	} catch (error) {
		loggerError(
			"unexpected",
			{
				caller: "AllImagePage",
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
