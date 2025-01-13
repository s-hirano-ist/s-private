import { StatusCodeView } from "@/components/card/status-code-view";
import { ImageStack } from "@/components/stack/image-stack";
import { ERROR_MESSAGES, PAGE_SIZE } from "@/constants";
import { getSelfId } from "@/features/auth/utils/role";
import { generateUrlWithMetadata } from "@/features/image/actions/generate-url-with-metadata";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

type Props = {
	page: number;
};

export async function AllImageStack({ page }: Props) {
	try {
		const userId = await getSelfId();

		const _images = await prisma.images.findMany({
			where: { userId },
			select: {
				id: true,
			},
			orderBy: { id: "desc" },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
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

		return <ImageStack data={images} />;
	} catch (error) {
		loggerError(
			ERROR_MESSAGES.UNEXPECTED,
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
