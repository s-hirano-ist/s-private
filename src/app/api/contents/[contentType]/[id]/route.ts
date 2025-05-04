import {
	NOT_FOUND_IMAGE_PATH,
	ORIGINAL_IMAGE_PATH,
	THUMBNAIL_IMAGE_PATH,
} from "@/constants";
import { env } from "@/env";
import { NotAllowedError } from "@/error-classes";
import { auth } from "@/features/auth/utils/auth";
import { minioClient } from "@/minio";
import { loggerError } from "@/pino";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const GET = auth(
	async (
		request,
		{ params }: { params: Promise<{ contentType: string; id: string }> },
	) => {
		try {
			const { contentType, id } = await params;

			if (!request.auth)
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

			if (!request.auth.user.roles.includes("viewer"))
				throw new NotAllowedError();

			const objKey = `${contentType === "thumbnail" ? THUMBNAIL_IMAGE_PATH : ORIGINAL_IMAGE_PATH}/${id}`;

			const stream = await minioClient.getObject(env.MINIO_BUCKET_NAME, objKey);

			// eslint-disable-next-line
			return new Response(stream as any, {
				headers: {
					"Content-Type": "image/jpeg",
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			});
		} catch (error) {
			loggerError(
				"unexpected",
				{
					caller: "GenerateUrlError",
					status: 500,
				},
				error,
			);
			// FIXME: redirect not working
			redirect(NOT_FOUND_IMAGE_PATH);
		}
	},
);
