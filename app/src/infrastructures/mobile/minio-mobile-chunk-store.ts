import { env } from "@/env";
import { minioClient } from "@/minio";
import { createMobileChunkStore } from "@s-hirano-ist/s-backend/mobile/minio-chunk-store";
export const minioMobileChunkStore = createMobileChunkStore(
	minioClient,
	env.MINIO_BUCKET_NAME,
);
