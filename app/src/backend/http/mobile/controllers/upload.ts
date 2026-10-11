import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import {
	cancelMobileUpload,
	getMobileUpload,
} from "@/application-services/mobile/uploads";
type Params = { id: string };
export async function GET(request: Request, params: Params): Promise<Response> {
	try {
		const { id } = params;
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await getMobileUpload(userId, id)),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
export async function DELETE(
	request: Request,
	params: Params,
): Promise<Response> {
	try {
		const { id } = params;
		return await withMobileTenant(request, async (userId) => {
			await cancelMobileUpload(userId, id);
			return new Response(null, { status: 204 });
		});
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
