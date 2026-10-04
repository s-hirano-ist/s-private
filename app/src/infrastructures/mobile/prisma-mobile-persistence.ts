import type { MobilePersistence } from "@/application-services/mobile/ports";
import prisma from "@/prisma";
import { Prisma } from "@s-hirano-ist/s-database";

function unreachable(_domain: never): never {
	throw new Error("Unsupported mobile domain");
}

export const prismaMobilePersistence: MobilePersistence = {
	isRecordNotFoundError(error) {
		return (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		);
	},
	async findLinkedUser(subject) {
		const accounts = await prisma.account.findMany({
			where: { providerId: "auth0", accountId: subject },
			select: { userId: true },
			take: 2,
		});
		return accounts.length === 1 ? (accounts[0]?.userId ?? null) : null;
	},
	async listContent(domain, userId, query) {
		const where = { userId, ...(query.status ? { status: query.status } : {}) };
		const args = {
			where,
			orderBy: { createdAt: "desc" as const },
			skip: query.offset,
			take: query.limit,
		};
		switch (domain) {
			case "articles": {
				const [rows, totalCount] = await Promise.all([
					prisma.article.findMany({
						...args,
						include: { Category: { select: { name: true } } },
					}),
					prisma.article.count({ where }),
				]);
				return {
					data: rows.map(({ Category, ...article }) =>
						Object.assign(article, { categoryName: Category.name }),
					),
					totalCount,
				};
			}
			case "notes": {
				const [data, totalCount] = await Promise.all([
					prisma.note.findMany(args),
					prisma.note.count({ where }),
				]);
				return { data, totalCount };
			}
			case "images": {
				const [data, totalCount] = await Promise.all([
					prisma.image.findMany(args),
					prisma.image.count({ where }),
				]);
				return { data, totalCount };
			}
			case "books": {
				const [data, totalCount] = await Promise.all([
					prisma.book.findMany(args),
					prisma.book.count({ where }),
				]);
				return { data, totalCount };
			}
		}
		return unreachable(domain);
	},
	async manifest(userId) {
		const select = { id: true, updatedAt: true } as const;
		const where = { userId };
		const [articles, notes, books, images, categories] = await Promise.all([
			prisma.article.findMany({ where, select, orderBy: { id: "asc" } }),
			prisma.note.findMany({ where, select, orderBy: { id: "asc" } }),
			prisma.book.findMany({ where, select, orderBy: { id: "asc" } }),
			prisma.image.findMany({
				where,
				select: {
					id: true,
					status: true,
					createdAt: true,
					updatedAt: true,
					exportedAt: true,
					path: true,
					contentType: true,
					fileSize: true,
					width: true,
					height: true,
				},
				orderBy: { id: "asc" },
			}),
			prisma.category.findMany({
				where,
				select: { id: true, name: true },
				orderBy: { id: "asc" },
			}),
		]);
		return { articles, notes, books, images, categories };
	},
	async getContent(domain, userId, id) {
		switch (domain) {
			case "articles": {
				const article = await prisma.article.findFirst({
					where: { id, userId },
					include: { Category: { select: { name: true } } },
				});
				if (!article) return null;
				const { Category, ...item } = article;
				return { ...item, categoryName: Category.name };
			}
			case "notes":
				return prisma.note.findFirst({ where: { id, userId } });
			case "images":
				return prisma.image.findFirst({ where: { id, userId } });
			case "books":
				return prisma.book.findFirst({ where: { id, userId } });
		}
		return unreachable(domain);
	},
	listCategories(userId) {
		return prisma.category.findMany({
			where: { userId },
			select: { id: true, name: true },
			orderBy: { name: "asc" },
		});
	},
	async lookupContentId(domain, userId, key) {
		switch (domain) {
			case "articles":
				return (
					(
						await prisma.article.findFirst({
							where: { userId, url: key },
							select: { id: true },
						})
					)?.id ?? null
				);
			case "notes":
				return (
					(
						await prisma.note.findFirst({
							where: { userId, title: key },
							select: { id: true },
						})
					)?.id ?? null
				);
			case "images":
				return (
					(
						await prisma.image.findFirst({
							where: { userId },
							orderBy: { createdAt: "desc" },
							select: { id: true },
						})
					)?.id ?? null
				);
			case "books":
				return (
					(
						await prisma.book.findFirst({
							where: { userId, isbn: key },
							select: { id: true },
						})
					)?.id ?? null
				);
		}
		return unreachable(domain);
	},
	async getSyncVersion(userId) {
		const head = await prisma.mobileSyncVersion.findUnique({
			where: { userId },
			select: { version: true },
		});
		return head?.version ?? 0n;
	},
	async snapshot(domain, userId, after, take) {
		const where = { userId, id: { gt: after } };
		switch (domain) {
			case "articles":
				return (
					await prisma.article.findMany({
						where,
						include: { Category: { select: { name: true } } },
						orderBy: { id: "asc" },
						take,
					})
				).map(({ Category, ...record }) =>
					Object.assign(record, { categoryName: Category.name }),
				);
			case "notes":
				return prisma.note.findMany({ where, orderBy: { id: "asc" }, take });
			case "books":
				return prisma.book.findMany({ where, orderBy: { id: "asc" }, take });
			case "images":
				return prisma.image.findMany({ where, orderBy: { id: "asc" }, take });
			case "categories":
				return prisma.category.findMany({
					where,
					select: { id: true, name: true },
					orderBy: { id: "asc" },
					take,
				});
		}
		return unreachable(domain);
	},
	changes(userId, after, take) {
		return prisma.mobileSyncChange.findMany({
			where: { userId, version: { gt: after } },
			orderBy: { version: "asc" },
			take,
		});
	},
	async changeRecords(userId, changes) {
		const ids = (domain: string) =>
			changes
				.filter((event) => event.domain === domain)
				.map((event) => event.recordId);
		const [articles, notes, books, images, categories] = await Promise.all([
			prisma.article.findMany({
				where: { userId, id: { in: ids("articles") } },
				include: { Category: { select: { name: true } } },
			}),
			prisma.note.findMany({ where: { userId, id: { in: ids("notes") } } }),
			prisma.book.findMany({ where: { userId, id: { in: ids("books") } } }),
			prisma.image.findMany({ where: { userId, id: { in: ids("images") } } }),
			prisma.category.findMany({
				where: { userId, id: { in: ids("categories") } },
				select: { id: true, name: true },
			}),
		]);
		const byKey = new Map<string, unknown>();
		for (const { Category, ...article } of articles)
			byKey.set(`articles:${article.id}`, {
				...article,
				categoryName: Category.name,
			});
		for (const [domain, records] of [
			["notes", notes],
			["books", books],
			["images", images],
			["categories", categories],
		] as const) {
			for (const record of records) byKey.set(`${domain}:${record.id}`, record);
		}
		return byKey;
	},
	findOperation(id) {
		return prisma.mobileOperation.findUnique({ where: { id } });
	},
	async createOperation(id, userId, domain, inputHash) {
		await prisma.mobileOperation.create({
			data: { id, userId, domain, inputHash },
		});
	},
	async markOperationPending(id) {
		await prisma.mobileOperation.update({
			where: { id },
			data: { status: "PENDING", errorCode: null },
		});
	},
	async markOperationSucceeded(id, resourceId) {
		await prisma.mobileOperation.update({
			where: { id },
			data: { status: "SUCCEEDED", resourceId },
		});
	},
	async markOperationFailed(id, errorCode) {
		await prisma.mobileOperation.update({
			where: { id },
			data: { status: "FAILED", errorCode },
		});
	},
	findUpload(userId, id) {
		return prisma.mobileUpload.findFirst({ where: { id, userId } });
	},
	findUploadByOperation(userId, operationId) {
		return prisma.mobileUpload.findFirst({ where: { userId, operationId } });
	},
	createUpload(upload) {
		return prisma.mobileUpload.create({ data: upload });
	},
	async updateUploadParts(id, parts) {
		await prisma.mobileUpload.update({
			where: { id },
			data: { receivedParts: parts },
		});
	},
	async deleteUpload(id) {
		await prisma.mobileUpload.delete({ where: { id } });
	},
	findExpiredUploads(now) {
		return prisma.mobileUpload.findMany({ where: { expiresAt: { lt: now } } });
	},
};
