import { StatusCodeView } from "@/components/card/status-code-view";
import { ImageStack } from "@/components/stack/image-stack";
import { PAGE_SIZE } from "@/constants";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

type Props = { page: number };

export async function AllImageStack({ page }: Props) {
	try {
		const images = await prisma.staticImages.findMany({
			select: { id: true, width: true, height: true },
			orderBy: { id: "desc" },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			cacheStrategy: { ttl: 400, swr: 40, tags: ["staticImages"] },
		});

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
