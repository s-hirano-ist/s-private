import { env } from "@/env";
import { minioClient } from "@/minio";
import { createImagesStorageService } from "@s-hirano-ist/s-backend/shared/minio-storage-service";
export const minioStorageService = createImagesStorageService(
	minioClient,
	env.MINIO_BUCKET_NAME,
);
