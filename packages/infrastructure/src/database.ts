import { Prisma, type PrismaClient } from "@s-hirano-ist/s-database";

/** Configure framework-independent query hooks, preserving Prisma's extension types. */
export function extendDatabase(
	client: PrismaClient,
	filter: (model: string, operation: string, args: unknown) => unknown,
	observe: (
		model: string | undefined,
		operation: string,
		duration: number,
	) => void,
) {
	const tenantExtension = Prisma.defineExtension({
		query: {
			article: {
				$allOperations({ args, query, operation, model }) {
					return query(filter(model, operation, args) as typeof args);
				},
			},
			note: {
				$allOperations({ args, query, operation, model }) {
					return query(filter(model, operation, args) as typeof args);
				},
			},
			image: {
				$allOperations({ args, query, operation, model }) {
					return query(filter(model, operation, args) as typeof args);
				},
			},
			book: {
				$allOperations({ args, query, operation, model }) {
					return query(filter(model, operation, args) as typeof args);
				},
			},
			category: {
				$allOperations({ args, query, operation, model }) {
					return query(filter(model, operation, args) as typeof args);
				},
			},
		},
	});
	return client
		.$extends({
			query: {
				async $allOperations({ args, query, operation, model }) {
					const start = Date.now();
					const result: unknown = await query(args);
					observe(model, operation, Date.now() - start);
					return result;
				},
			},
		})
		.$extends(tenantExtension);
}

export type DatabaseClient = ReturnType<typeof extendDatabase>;
