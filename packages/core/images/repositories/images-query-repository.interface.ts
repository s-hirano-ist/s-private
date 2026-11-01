import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type { Path } from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
/** Domain duplication checks need existence, not a reconstructed content lifecycle. */
export type IImagesQueryRepository = {
	existsByPath(key: Path, userId: UserId): Promise<boolean>;
};
