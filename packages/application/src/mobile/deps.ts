import type {
	MobileAccountRepository,
	MobileChunkStore,
	MobileContentRepository,
	MobileErrorClassifier,
	MobileOperationRepository,
	MobileSyncRepository,
	MobileUploadRepository,
} from "@s-hirano-ist/s-application/mobile/ports";
import type { Transaction } from "@s-hirano-ist/s-application/transaction";
export type MobileDeps = {
	accounts: MobileAccountRepository;
	chunks: MobileChunkStore;
	content: MobileContentRepository;
	errors: MobileErrorClassifier;
	operations: MobileOperationRepository;
	sync: MobileSyncRepository;
	transactions: Transaction;
	uploads: MobileUploadRepository;
};
