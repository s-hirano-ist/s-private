import type {
	MobileAccountRepository,
	MobileChunkStore,
	MobileContentRepository,
	MobileErrorClassifier,
	MobileOperationRepository,
	MobileSyncRepository,
	MobileUploadRepository,
} from "@s-hirano-ist/s-application/mobile/ports";
export type MobileDeps = {
	accounts: MobileAccountRepository;
	chunks: MobileChunkStore;
	content: MobileContentRepository;
	errors: MobileErrorClassifier;
	operations: MobileOperationRepository;
	sync: MobileSyncRepository;
	uploads: MobileUploadRepository;
};
