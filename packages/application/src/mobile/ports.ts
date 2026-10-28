import type {
	ReadModelByDomain,
	StoredSnapshot,
} from "@s-hirano-ist/s-application/content/models";
import type { MobileDomain } from "@s-hirano-ist/s-application/content/models";
import type { SyncDomain } from "@s-hirano-ist/s-application/content/models";

export type MobileUpload = {
	contentType: string;
	domain: string;
	expiresAt: Date;
	fileSize: number;
	id: string;
	metadata: unknown;
	operationId: string;
	receivedParts: number[];
	userId: string;
};

export type MobileOperation = {
	domain: string;
	inputHash: string;
	resourceId: string | null;
	status: "PENDING" | "SUCCEEDED" | "FAILED";
	userId: string;
};

export type SyncChange = {
	action: "delete" | "upsert";
	domain: SyncDomain;
	recordId: string;
	version: bigint;
};

export type MobileErrorClassifier = {
	isRecordNotFoundError(error: unknown): boolean;
};

export type MobileAccountRepository = {
	findLinkedUser(subject: string): Promise<string | null>;
};

export type MobileContentRepository = {
	getContent<D extends MobileDomain>(
		domain: D,
		userId: string,
		id: string,
	): Promise<ReadModelByDomain[D] | null>;
	listCategories(userId: string): Promise<ReadModelByDomain["categories"][]>;
	listContent<D extends MobileDomain>(
		domain: D,
		userId: string,
		query: {
			limit: number;
			offset: number;
			status?: "UNEXPORTED" | "LAST_UPDATED" | "EXPORTED";
		},
	): Promise<{ data: ReadModelByDomain[D][]; totalCount: number }>;
	lookupContentId(
		domain: MobileDomain,
		userId: string,
		key?: string,
	): Promise<string | null>;
};

export type MobileSyncRepository = {
	changeRecords(
		userId: string,
		changes: SyncChange[],
	): Promise<Map<string, StoredSnapshot>>;
	changes(userId: string, after: bigint, take: number): Promise<SyncChange[]>;
	getSyncVersion(userId: string): Promise<bigint>;
	snapshot<D extends SyncDomain>(
		domain: D,
		userId: string,
		after: string,
		take: number,
	): Promise<ReadModelByDomain[D][]>;
};

export type MobileOperationRepository = {
	createOperation(
		id: string,
		userId: string,
		domain: string,
		inputHash: string,
	): Promise<void>;
	findOperation(id: string): Promise<MobileOperation | null>;
	markOperationFailed(id: string, errorCode: string): Promise<void>;
	markOperationPending(id: string): Promise<void>;
	markOperationSucceeded(id: string, resourceId: string): Promise<void>;
};

export type MobileUploadRepository = {
	createUpload(
		upload: Omit<MobileUpload, "receivedParts" | "metadata"> & {
			metadata: Record<string, string>;
		},
	): Promise<MobileUpload>;
	deleteUpload(id: string): Promise<void>;
	findExpiredUploads(now: Date): Promise<MobileUpload[]>;
	findUpload(userId: string, id: string): Promise<MobileUpload | null>;
	findUploadByOperation(
		userId: string,
		operationId: string,
	): Promise<MobileUpload | null>;
	updateUploadParts(id: string, parts: number[]): Promise<void>;
};

export type MobilePersistence = MobileErrorClassifier &
	MobileAccountRepository &
	MobileContentRepository &
	MobileSyncRepository &
	MobileOperationRepository &
	MobileUploadRepository;

export type MobileChunkStore = {
	get(uploadId: string, part: number): Promise<Buffer>;
	put(uploadId: string, part: number, bytes: Uint8Array): Promise<void>;
	remove(uploadId: string, part: number): Promise<void>;
};
