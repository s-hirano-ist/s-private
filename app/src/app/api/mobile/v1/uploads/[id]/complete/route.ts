import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import { completeMobileUpload } from "@/application-services/mobile/uploads";
type Context = { params: Promise<{ id: string }> };
export async function POST(
	request: Request,
	{ params }: Context,
): Promise<Response> {
	try {
		const { id } = await params;
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await completeMobileUpload(userId, id), 201),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
