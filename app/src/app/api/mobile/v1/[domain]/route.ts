import {
	MobileApiError,
	withMobileTenant,
} from "@/application-services/mobile/auth";
import {
	createMobileContent,
	domainSchema,
	listMobileContent,
	listSchema,
	MOBILE_MULTIPART_LIMIT,
} from "@/application-services/mobile/content";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";

type Context = { params: Promise<{ domain: string }> };

async function readBoundedMultipart(request: Request): Promise<FormData> {
	if (!request.body) throw new MobileApiError("VALIDATION_ERROR", 422);
	const reader = request.body.getReader();
	const parts: Uint8Array[] = [];
	let size = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > MOBILE_MULTIPART_LIMIT)
				throw new MobileApiError("UPLOAD_TOO_LARGE", 413);
			parts.push(value);
		}
	} finally {
		releaseReader(reader);
	}
	const bytes = Buffer.concat(parts);
	return new Request(request.url, {
		method: "POST",
		headers: { "content-type": request.headers.get("content-type") ?? "" },
		body: bytes,
	}).formData();
}

function releaseReader(reader: ReadableStreamDefaultReader<Uint8Array>): void {
	void reader.cancel().catch(() => null);
	reader.releaseLock();
}

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
		return await withMobileTenant(request, async (userId) => {
			const contentType = request.headers.get("content-type") ?? "";
			const body: unknown = contentType.startsWith("multipart/form-data")
				? await readBoundedMultipart(request)
				: await request.json();
			await createMobileContent(parsedDomain, userId, body);
			return mobileJson({ accepted: true }, 201);
		});
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
