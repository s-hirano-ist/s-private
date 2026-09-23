import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import {
	cancelMobileUpload,
	getMobileUpload,
} from "@/application-services/mobile/uploads";
type Context = { params: Promise<{ id: string }> };
export async function GET(
	request: Request,
	{ params }: Context,
): Promise<Response> {
	try {
		const { id } = await params;
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await getMobileUpload(userId, id)),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
export async function DELETE(
	request: Request,
	{ params }: Context,
): Promise<Response> {
	try {
		const { id } = await params;
		return await withMobileTenant(request, async (userId) => {
			await cancelMobileUpload(userId, id);
			return new Response(null, { status: 204 });
		});
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
