import { StatusCodeView } from "@/components/status/status-code-view";
import { getUnexportedImagesByUserId } from "@/features/images/actions/get-images";
import { loggerError } from "@/pino";
import { ImageStackClient } from "./client";

export async function ImageStack() {
	try {
		const images = await getUnexportedImagesByUserId();

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
