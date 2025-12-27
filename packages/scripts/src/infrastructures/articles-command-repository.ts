import type {
	BulkUpdateResult,
	IArticlesCommandRepository,
	StatusTransitionParams,
	UnexportedArticle,
} from "@s-hirano-ist/s-core/articles";
import type { Id, Status, UserId } from "@s-hirano-ist/s-core/common";

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
 * Creates an Articles command repository for batch operations.
 *
 * @param prisma - The Prisma client or transaction client
 * @returns An IArticlesCommandRepository implementation
 *
 * @remarks
 * This is a specialized implementation for batch scripts.
 * It only implements bulkUpdateStatus for performance.
 * Other methods (create, deleteById) throw errors as they
 * are not needed in the batch processing context.
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
): IArticlesCommandRepository {
	return {
		async create(_data: UnexportedArticle): Promise<void> {
			throw new Error(
				"create is not implemented in scripts context. Use app repository instead.",
			);
		},

		async deleteById(_id: Id, _userId: UserId, _status: Status): Promise<void> {
			throw new Error(
				"deleteById is not implemented in scripts context. Use app repository instead.",
			);
		},

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
