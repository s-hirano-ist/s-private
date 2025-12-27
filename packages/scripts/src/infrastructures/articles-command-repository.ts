import type {
	BulkUpdateResult,
	IBatchCommandRepository,
	StatusTransitionParams,
} from "@s-hirano-ist/s-core/common";

/**
 * Prisma client type for transaction support.
 *
 * @remarks
 * This is a minimal type that supports both regular PrismaClient
 * and transaction clients (from $transaction).
 * Uses a generic approach to accept Prisma's strict typing.
 */
type PrismaClientLike = {
	article: {
		updateMany: (args: any) => Promise<{ count: number }>;
	};
};

/**
 * Creates an Articles batch command repository for bulk operations.
 *
 * @param prisma - The Prisma client or transaction client
 * @returns An IBatchCommandRepository implementation for articles
 *
 * @remarks
 * This is a specialized implementation for batch scripts.
 * It only implements bulkUpdateStatus for performance.
 *
 * @example
 * ```typescript
 * const prisma = new PrismaClient({ accelerateUrl: env.DATABASE_URL });
 *
 * await prisma.$transaction(async (tx) => {
 *   const repo = createArticlesCommandRepository(tx);
 *   const batchService = new ArticlesBatchDomainService(repo);
 *   await batchService.resetArticles(userId);
 * });
 * ```
 */
export function createArticlesCommandRepository(
	prisma: PrismaClientLike,
): IBatchCommandRepository {
	return {
		async bulkUpdateStatus(
			params: StatusTransitionParams,
		): Promise<BulkUpdateResult> {
			const { userId, fromStatus, toStatus, exportedAt } = params;

			const result = await prisma.article.updateMany({
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
