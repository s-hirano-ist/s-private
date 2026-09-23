import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import { putMobileChunk } from "@/application-services/mobile/uploads";
type Context = { params: Promise<{ id: string; part: string }> };
export async function PUT(
	request: Request,
	{ params }: Context,
): Promise<Response> {
	try {
		const { id, part } = await params;
		const bytes = new Uint8Array(await request.arrayBuffer());
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await putMobileChunk(userId, id, Number(part), bytes)),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
