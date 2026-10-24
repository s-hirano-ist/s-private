import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import {
	listSyncSnapshot,
	snapshotQuerySchema,
} from "@/application-services/mobile/sync";

export async function GET(request: Request): Promise<Response> {
	try {
		const query = snapshotQuerySchema.parse(
			Object.fromEntries(new URL(request.url).searchParams),
		);
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await listSyncSnapshot(userId, query)),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
