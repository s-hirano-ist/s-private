import type { Id, Status, UserId } from "@s-hirano-ist/s-core/common";
import type {
	BulkUpdateResult,
	INotesCommandRepository,
	StatusTransitionParams,
	UnexportedNote,
} from "@s-hirano-ist/s-core/notes";

type PrismaClientLike = {
	note: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for Prisma client compatibility
		updateMany: (args: any) => Promise<{ count: number }>;
	};
};

export function createNotesCommandRepository(
	prisma: PrismaClientLike,
): INotesCommandRepository {
	return {
		async create(_data: UnexportedNote): Promise<void> {
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
