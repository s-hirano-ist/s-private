import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import { getSyncHead } from "@/application-services/mobile/sync";

export async function GET(request: Request): Promise<Response> {
	try {
		return await withMobileTenant(request, async (userId) =>
			mobileJson({ cursor: await getSyncHead(userId) }),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
