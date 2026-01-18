import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	StatusTransitionParams,
} from "@s-hirano-ist/s-core/shared-kernel/repositories/batch-command-repository.interface";

type PrismaClientLike = {
	image: {
		updateMany: (args: any) => Promise<{ count: number }>;
	};
};

/**
 * Creates an Images batch command repository for bulk operations.
 *
 * @param prisma - The Prisma client or transaction client
 * @returns An IBatchCommandRepository implementation for images
 */
export function createImagesCommandRepository(
	prisma: PrismaClientLike,
): IBatchCommandRepository {
	return {
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
