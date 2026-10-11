import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	deleteMobileContent,
	domainSchema,
	getMobileContent,
} from "@/application-services/mobile/content";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";

type Params = { domain: string; id: string };

export async function GET(request: Request, params: Params): Promise<Response> {
	try {
		const { domain, id } = params;
		const parsedDomain = domainSchema.parse(domain);
		return await withMobileTenant(request, async (userId) =>
			mobileJson(await getMobileContent(parsedDomain, userId, id)),
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
		const { domain, id } = params;
		const parsedDomain = domainSchema.parse(domain);
		return await withMobileTenant(request, async (userId) => {
			await deleteMobileContent(parsedDomain, userId, id);
			return new Response(null, { status: 204 });
		});
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
