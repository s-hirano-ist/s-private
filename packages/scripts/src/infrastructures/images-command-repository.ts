import type { Status } from "@s-hirano-ist/s-core/common";
import type {
	BulkUpdateResult,
	IImagesCommandRepository,
	Path,
	StatusTransitionParams,
	UnexportedImage,
} from "@s-hirano-ist/s-core/images";

type PrismaClientLike = {
	image: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for Prisma client compatibility
		updateMany: (args: any) => Promise<{ count: number }>;
	};
};

export function createImagesCommandRepository(
	prisma: PrismaClientLike,
): IImagesCommandRepository {
	return {
		async create(_data: UnexportedImage): Promise<void> {
			throw new Error(
				"create is not implemented in scripts context. Use app repository instead.",
			);
		},

		async uploadToStorage(
			_path: Path,
			_buffer: Buffer,
			_isThumbnail: boolean,
		): Promise<void> {
			throw new Error(
				"uploadToStorage is not implemented in scripts context. Use app repository instead.",
			);
		},

		async deleteById(
			_id: string,
			_userId: string,
			_status: Status,
		): Promise<void> {
			throw new Error(
				"deleteById is not implemented in scripts context. Use app repository instead.",
			);
		},

		async bulkUpdateStatus(
			params: StatusTransitionParams,
		): Promise<BulkUpdateResult> {
			const { userId, fromStatus, toStatus, exportedAt } = params;

			const result = await prisma.image.updateMany({
				where: {
					userId: userId as string,
					status: fromStatus as string,
				},
				data: {
					status: toStatus as string,
					...(exportedAt && { exportedAt: exportedAt as Date }),
				},
			});

			return { count: result.count };
		},
	};
}
