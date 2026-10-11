import type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
export type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
import { minioMobileChunkStore } from "@/infrastructures/mobile/minio-mobile-chunk-store";
import { prismaMobilePersistence } from "@/infrastructures/mobile/prisma-mobile-persistence";

export const defaultMobileDeps: MobileDeps = {
	accounts: prismaMobilePersistence,
	content: prismaMobilePersistence,
	sync: prismaMobilePersistence,
	operations: prismaMobilePersistence,
	uploads: prismaMobilePersistence,
	errors: prismaMobilePersistence,
	chunks: minioMobileChunkStore,
};
