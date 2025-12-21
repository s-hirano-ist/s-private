import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeUnexportedStatus, makeUserId } from "@s-hirano-ist/s-core/common";
import type { PrismaClient } from "@s-hirano-ist/s-database";
import * as Minio from "minio";
import type { MinioEnv } from "../shared/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fetchImages(
	prisma: PrismaClient,
	env: MinioEnv,
): Promise<void> {
	const userId = makeUserId(env.USERNAME_TO_EXPORT);
	const UNEXPORTED = makeUnexportedStatus();

	const minioClient = new Minio.Client({
		endPoint: env.MINIO_HOST,
		port: Number(env.MINIO_PORT),
		useSSL: true,
		accessKey: env.MINIO_ACCESS_KEY,
		secretKey: env.MINIO_SECRET_KEY,
	});

	const images = await prisma.image.findMany({
		where: { userId, status: UNEXPORTED },
	});
	console.log(`Fetched ${images.length} images.`);

	const downloadPromises = images.map(async (image: { path: string }) => {
		const { path: imagePath } = image;

		const filePath = path.join(__dirname, "../../image/dump", `${imagePath}`);

		await minioClient.fGetObject(
			env.MINIO_BUCKET_NAME,
			`images/original/${imagePath}`,
			filePath,
		);
	});

	await Promise.all(downloadPromises);
	console.log("All images saved.");
}
