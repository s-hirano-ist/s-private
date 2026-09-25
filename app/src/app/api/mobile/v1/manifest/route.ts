import { withMobileTenant } from "@/application-services/mobile/auth";
import { listMobileManifest } from "@/application-services/mobile/content";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";

export async function GET(request: Request): Promise<Response> {
	try {
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await listMobileManifest(userId)),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
