import "server-only";
import type { DeleteImageDeps } from "@/application-services/images/delete-image.deps";
import type { ServerAction } from "@/common/types";
import type {
	Id,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { deleteImage } from "@s-hirano-ist/s-backend/images/use-cases";
export async function deleteImageCore(
	id: Id,
	deps: DeleteImageDeps,
	principalId?: UserId,
): Promise<ServerAction> {
	try {
		await deleteImage(id, principalId ?? (await getSelfId()), deps);
		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
