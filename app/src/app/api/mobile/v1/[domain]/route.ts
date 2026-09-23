import {
	MobileApiError,
	withMobileTenant,
} from "@/application-services/mobile/auth";
import {
	createMobileContent,
	domainSchema,
	listMobileContent,
	listSchema,
} from "@/application-services/mobile/content";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";

type Context = { params: Promise<{ domain: string }> };

export async function GET(
	request: Request,
	{ params }: Context,
): Promise<Response> {
	try {
		const { domain } = await params;
		const parsedDomain = domainSchema.parse(domain);
		const url = new URL(request.url);
		const query = listSchema.parse(Object.fromEntries(url.searchParams));
		return await withMobileTenant(request, async (userId) =>
			mobileJson({
				...(await listMobileContent(parsedDomain, userId, query)),
				offset: query.offset,
				limit: query.limit,
			}),
		);
	} catch (error) {
		return mobileErrorResponse(error);
	}
}

export async function POST(
	request: Request,
	{ params }: Context,
): Promise<Response> {
	try {
		const { domain } = await params;
		const parsedDomain = domainSchema.parse(domain);
		if (parsedDomain === "images" || parsedDomain === "books")
			throw new MobileApiError("VALIDATION_ERROR", 422);
		return await withMobileTenant(request, async (userId) => {
			const body: unknown = await request.json();
			return mobileJson(
				await createMobileContent(parsedDomain, userId, body),
				201,
			);
		});
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
