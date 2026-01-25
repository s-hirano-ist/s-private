import type {
	ExportedAt,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	ResetStatusResult,
	StatusTransitionParams,
} from "@s-hirano-ist/s-core/shared-kernel/repositories/batch-command-repository.interface";

type PrismaClientLike = {
	note: {
		updateMany: (args: any) => Promise<{ count: number }>;
	};
	$transaction: <T extends Promise<{ count: number }>[]>(
		queries: [...T],
	) => Promise<{ [K in keyof T]: { count: number } }>;
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

		async resetStatus(
			userId: UserId,
			exportedAt: ExportedAt,
		): Promise<ResetStatusResult> {
			const [finalized, marked] = await prisma.$transaction([
				prisma.note.updateMany({
					where: {
						userId: userId as string,
						status: "LAST_UPDATED",
					},
					data: {
						status: "EXPORTED",
						exportedAt: exportedAt as Date,
					},
				}),
				prisma.note.updateMany({
					where: {
						userId: userId as string,
						status: "UNEXPORTED",
					},
					data: {
						status: "LAST_UPDATED",
					},
				}),
			]);

			return {
				finalized: { count: finalized.count },
				marked: { count: marked.count },
			};
		},
	};
}
