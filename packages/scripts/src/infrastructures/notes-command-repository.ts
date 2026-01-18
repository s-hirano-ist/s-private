import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	StatusTransitionParams,
} from "@s-hirano-ist/s-core/common/repositories/batch-command-repository.interface";

type PrismaClientLike = {
	note: {
		updateMany: (args: any) => Promise<{ count: number }>;
	};
};

/**
 * Creates a Notes batch command repository for bulk operations.
 *
 * @param prisma - The Prisma client or transaction client
 * @returns An IBatchCommandRepository implementation for notes
 */
export function createNotesCommandRepository(
	prisma: PrismaClientLike,
): IBatchCommandRepository {
	return {
		async bulkUpdateStatus(
			params: StatusTransitionParams,
		): Promise<BulkUpdateResult> {
			const { userId, fromStatus, toStatus, exportedAt } = params;

			const result = await prisma.note.updateMany({
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
