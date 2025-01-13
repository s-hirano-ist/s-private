import { ImageStack } from "@/components/stack/image-stack";
import { PAGE_SIZE } from "@/constants";
import { getUserId } from "@/features/auth/utils/get-session";
import { generateUrlWithMetadata } from "@/features/image/actions/generate-url-with-metadata";
import prisma from "@/prisma";

type Props = {
	page: number;
};

export async function AllImageStack({ page }: Props) {
	const userId = await getUserId();

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
}
