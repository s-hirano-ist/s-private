import { StatusCodeView } from "@/components/status/status-code-view";
import { imageQueryRepository } from "@/features/images/repositories/image-query-repository";
import { loggerError } from "@/pino";
import { getSelfId } from "@/utils/auth/session";
import { ImageStackClient } from "./client";

export async function ImageStack() {
	try {
		const userId = await getSelfId();

		const images = await imageQueryRepository.findByStatusAndUserId("UNEXPORTED", userId);

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
