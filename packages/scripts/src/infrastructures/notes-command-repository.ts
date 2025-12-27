import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	StatusTransitionParams,
} from "@s-hirano-ist/s-core/common";

type PrismaClientLike = {
	note: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for Prisma client compatibility
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
