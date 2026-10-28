import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type {
	Path,
	ContentType,
	FileSize,
} from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
export type MediaCreationInput = {
	userId: UserId;
	path: Path;
	contentType: ContentType;
	fileSize: FileSize;
	originalBuffer: Uint8Array;
	thumbnailBuffer: Uint8Array;
};
