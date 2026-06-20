import { getBooksImageFromStorage } from "@/application-services/books/get-books";
import { getContentTypeFromPath } from "@/common/utils/content-type-utils";
import { auth } from "@/infrastructures/auth/auth";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ contentType: string; path: string }> },
) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { contentType, path } = await params;

	const isThumbnail = contentType === "thumbnail";
	const stream = await getBooksImageFromStorage(path, isThumbnail);
	const responseContentType = isThumbnail
		? "image/webp"
		: getContentTypeFromPath(path);

	return new Response(stream as unknown as BodyInit, {
		headers: {
			"Content-Type": responseContentType,
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}
