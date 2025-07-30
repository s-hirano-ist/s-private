import { StatusCodeView } from "@/components/card/status-code-view";
import { ImageStack as ImageStackComponent } from "@/components/stack/image-stack";
import { getSelfId } from "@/features/auth/utils/session";
import { loggerError } from "@/pino";
import db from "@/db";
import { images } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function ImageStack() {
	try {
		const userId = await getSelfId();

		const imageList = await db
			.select({
				id: images.id,
				width: images.width,
				height: images.height,
			})
			.from(images)
			.where(and(eq(images.userId, userId), eq(images.status, "UNEXPORTED")))
			.orderBy(desc(images.id));

		return <ImageStackComponent data={imageList} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ImagePage", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
