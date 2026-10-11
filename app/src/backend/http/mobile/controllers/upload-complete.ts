import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import { completeMobileUpload } from "@/application-services/mobile/uploads";
type Params = { id: string };
export async function POST(
	request: Request,
	params: Params,
): Promise<Response> {
	try {
		const { id } = params;
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await completeMobileUpload(userId, id), 201),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
