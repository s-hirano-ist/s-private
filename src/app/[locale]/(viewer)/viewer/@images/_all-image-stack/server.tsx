import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/status/status-code-view";
import { PAGE_SIZE } from "@/constants";
import { imageRepository } from "@/features/images/repositories/image-repository";
import { loggerError } from "@/pino";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { AllImageStackClient } from "./client";

type Props = { page: number };

export async function AllImageStack({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const images = await imageRepository.findAllPaginated(page, PAGE_SIZE);

		return <AllImageStackClient data={images} />;
	} catch (error) {
		loggerError("unexpected", { caller: "NewsStack", status: 500 }, error);
		return <StatusCodeView statusCode="500" />;
	}
}
