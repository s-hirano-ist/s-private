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
	leaseExpiresAt: Date | null;
	protocolVersion: number;
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
	claimOperation(
		id: string,
		userId: string,
		domain: string,
		inputHash: string,
	): Promise<{ token: string } | { resourceId: string }>;
	findOperation(id: string): Promise<MobileOperation | null>;
	markOperationFailed(
		id: string,
		errorCode: string,
		token: string,
	): Promise<void>;
	markOperationSucceeded(
		id: string,
		resourceId: string,
		token: string,
	): Promise<void>;
	renewOperation(id: string, token: string): Promise<boolean>;
};

export type UploadPart = {
	hash: string;
	objectKey: string;
	part: number;
	size: number;
};
export type UploadState =
	| "ACTIVE"
	| "COMPLETING"
	| "COMPLETED"
	| "CANCELLING"
	| "CANCELLED"
	| "EXPIRED";
export type UploadRecord = MobileUpload & {
	parts: UploadPart[];
	protocolVersion: number;
	resourceId: string | null;
	state: UploadState;
};
export type MobileUploadRepository = {
	acceptPart(userId: string, id: string, part: UploadPart): Promise<UploadPart>;
	assertUploadLease(id: string, token: string): Promise<void>;
	chunkKeys(
		id: string,
		now: Date,
	): Promise<{ objectKey: string; writingUntil: Date | null }[]>;
	claimUpload(
		userId: string,
		id: string,
		action: "complete" | "cancel" | "cleanup",
	): Promise<{ upload: UploadRecord; token: string }>;
	cleanupCandidates(now: Date): Promise<UploadRecord[]>;
	createUpload(
		upload: Omit<MobileUpload, "receivedParts">,
	): Promise<UploadRecord>;
	deleteExpiredUpload(id: string, now: Date): Promise<void>;
	findUpload(userId: string, id: string): Promise<UploadRecord | null>;
	findUploadByOperation(
		userId: string,
		operationId: string,
	): Promise<UploadRecord | null>;
	finishChunk(key: string): Promise<void>;
	finishUpload(
		id: string,
		token: string,
		resourceId: string | null,
	): Promise<void>;
	forgetChunk(key: string): Promise<void>;
	releaseUpload(id: string, token: string): Promise<void>;
	renewChunk(key: string): Promise<boolean>;
	renewUpload(id: string, token: string): Promise<boolean>;
	reserveChunk(userId: string, id: string, key: string): Promise<void>;
};

export type MobilePersistence = MobileErrorClassifier &
	MobileAccountRepository &
	MobileContentRepository &
	MobileSyncRepository &
	MobileOperationRepository &
	MobileUploadRepository;

export type MobileChunkStore = {
	get(objectKey: string): Promise<Buffer>;
	put(objectKey: string, bytes: Uint8Array): Promise<void>;
	remove(objectKey: string): Promise<void>;
};
