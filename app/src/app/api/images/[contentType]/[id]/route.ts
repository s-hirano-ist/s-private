import { getImagesFromStorage } from "@/application-services/images/get-images";
import { getContentTypeFromPath } from "@/common/utils/content-type-utils";
import { auth } from "@/infrastructures/auth/auth";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ contentType: string; id: string }> },
) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { contentType, id } = await params;

	const isThumbnail = contentType === "thumbnail";
	const nodeStream = await getImagesFromStorage(id, isThumbnail);
	const webStream = Readable.toWeb(
		nodeStream as Readable,
	) as unknown as ReadableStream;
	const responseContentType = isThumbnail
		? "image/webp"
		: getContentTypeFromPath(id);

	return new Response(webStream, {
		headers: {
			"Content-Type": responseContentType,
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}
