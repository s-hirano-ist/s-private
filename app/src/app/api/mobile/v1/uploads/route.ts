import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import { startMobileUpload } from "@/application-services/mobile/uploads";

export async function POST(request: Request): Promise<Response> {
	try {
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await startMobileUpload(userId, await request.json()), 201),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
