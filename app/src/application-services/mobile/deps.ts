import type {
	MobileAccountRepository,
	MobileChunkStore,
	MobileContentRepository,
	MobileErrorClassifier,
	MobileOperationRepository,
	MobileSyncRepository,
	MobileUploadRepository,
} from "@/application-services/mobile/ports";
import { minioMobileChunkStore } from "@/infrastructures/mobile/minio-mobile-chunk-store";
import { prismaMobilePersistence } from "@/infrastructures/mobile/prisma-mobile-persistence";

export type MobileDeps = {
	accounts: MobileAccountRepository;
	chunks: MobileChunkStore;
	content: MobileContentRepository;
	errors: MobileErrorClassifier;
	operations: MobileOperationRepository;
	sync: MobileSyncRepository;
	uploads: MobileUploadRepository;
};

export const defaultMobileDeps: MobileDeps = {
	accounts: prismaMobilePersistence,
	content: prismaMobilePersistence,
	sync: prismaMobilePersistence,
	operations: prismaMobilePersistence,
	uploads: prismaMobilePersistence,
	errors: prismaMobilePersistence,
	chunks: minioMobileChunkStore,
};
