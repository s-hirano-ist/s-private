import type {
	ImportRepository,
	ImportRecord,
	ImportChange,
} from "@s-hirano-ist/s-application/batch/import-models";
import type { PrismaClient, Prisma } from "@s-hirano-ist/s-database";
import {
	importChange,
	importKey,
} from "@s-hirano-ist/s-application/batch/import-models";
import { statusSchema } from "@s-hirano-ist/s-application/content/models";
import { makeId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { withTransactionRetry } from "@s-hirano-ist/s-database";
import { withPersistenceErrors } from "@s-hirano-ist/s-infrastructure/persistence-errors";
import { z } from "zod";
async function categoryId(
	tx: Prisma.TransactionClient,
	owner: string,
	name: string,
	now: Date,
): Promise<string> {
	const existing = await tx.category.findUnique({
		where: { name_userId: { name, userId: owner } },
		select: { id: true },
	});
	if (existing) return existing.id;
	const created = await tx.category.create({
		data: { id: makeId(), name, userId: owner, createdAt: now },
		select: { id: true },
	});
	return created.id;
}
export function createContentImportRepository(
	prisma: PrismaClient,
): ImportRepository {
	return {
		async list(domain, owner) {
			let rows: unknown[];
			switch (domain) {
				case "articles":
					rows = (
						await prisma.article.findMany({
							where: { userId: owner },
							include: { Category: { select: { name: true } } },
						})
					).map(({ Category, ...row }) =>
						Object.assign(row, { categoryName: Category.name }),
					);
					break;
				case "notes":
					rows = await prisma.note.findMany({ where: { userId: owner } });
					break;
				case "books":
					rows = await prisma.book.findMany({ where: { userId: owner } });
					break;
				case "images":
					rows = await prisma.image.findMany({ where: { userId: owner } });
					break;
			}
			return rows.map((row): ImportRecord => {
				const { id, status } = z
					.object({ id: z.string(), status: statusSchema })
					.parse(row);
				const change = importChange(domain, id, row);
				return {
					id,
					status,
					key: importKey(change.values),
					values: change.values,
				};
			});
		},
		async save(owner, change: ImportChange, creating, now) {
			await withPersistenceErrors(() =>
				withTransactionRetry(() =>
					prisma.$transaction(async (tx) => {
						const where = { id: change.id, userId: owner };
						const base = {
							id: change.id,
							userId: owner,
							status: "EXPORTED" as const,
							createdAt: now,
							exportedAt: now,
						};
						switch (change.domain) {
							case "articles": {
								const { categoryName, ...values } = change.values;
								const category = await categoryId(tx, owner, categoryName, now);
								const data = { ...values, categoryId: category };
								if (creating)
									await tx.article.create({ data: { ...base, ...data } });
								else await tx.article.update({ where, data });
								break;
							}
							case "notes":
								if (creating)
									await tx.note.create({ data: { ...base, ...change.values } });
								else await tx.note.update({ where, data: change.values });
								break;
							case "books":
								if (creating)
									await tx.book.create({ data: { ...base, ...change.values } });
								else await tx.book.update({ where, data: change.values });
								break;
							case "images":
								if (creating)
									await tx.image.create({
										data: { ...base, ...change.values },
									});
								else await tx.image.update({ where, data: change.values });
								break;
						}
					}),
				),
			);
		},
		async deleteExported(domain, owner, id) {
			const where = { id, userId: owner, status: "EXPORTED" as const };
			switch (domain) {
				case "articles":
					return (await prisma.article.deleteMany({ where })).count;
				case "notes":
					return (await prisma.note.deleteMany({ where })).count;
				case "books":
					return (await prisma.book.deleteMany({ where })).count;
				case "images":
					return (await prisma.image.deleteMany({ where })).count;
			}
			throw new Error("Unsupported content domain");
		},
		async isMediaReferenced(path) {
			return (await prisma.image.count({ where: { path } })) > 0;
		},
	};
}
