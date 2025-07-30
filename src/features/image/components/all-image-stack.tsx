import { StatusCodeView } from "@/components/card/status-code-view";
import { ImageStack } from "@/components/stack/image-stack";
import { PAGE_SIZE } from "@/constants";
import { loggerError } from "@/pino";
import db from "@/db";
import { staticImages } from "@/db/schema";
import { desc } from "drizzle-orm";

type Props = { page: number };

export async function AllImageStack({ page }: Props) {
	try {
		const images = await db
			.select({
				id: staticImages.id,
				width: staticImages.width,
				height: staticImages.height,
			})
			.from(staticImages)
			.orderBy(desc(staticImages.id))
			.limit(PAGE_SIZE)
			.offset((page - 1) * PAGE_SIZE);

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
