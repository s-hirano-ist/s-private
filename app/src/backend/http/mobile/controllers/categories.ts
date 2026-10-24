import { withMobileTenant } from "@/application-services/mobile/auth";
import { listMobileCategories } from "@/application-services/mobile/content";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";

export async function GET(request: Request): Promise<Response> {
	try {
		return await withMobileTenant(request, async (userId) =>
			mobileJson({ data: await listMobileCategories(userId) }),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
