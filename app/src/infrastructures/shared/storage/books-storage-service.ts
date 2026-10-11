import { env } from "@/env";
import { minioClient } from "@/minio";
import { createBooksStorageService } from "@s-hirano-ist/s-backend/shared/books-storage-service";
export const booksStorageService = createBooksStorageService(
	minioClient,
	env.MINIO_BUCKET_NAME,
);
