import type { ContentQueryRepository } from "@s-hirano-ist/s-application/content/queries";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
export function createContentQueryRepository(
	database: DatabaseClient,
): ContentQueryRepository {
	return {
		async count(domain, owner, status) {
			const where = { userId: owner, ...(status ? { status } : {}) };
			switch (domain) {
				case "articles":
					return database.article.count({ where });
				case "notes":
					return database.note.count({ where });
				case "images":
					return database.image.count({ where });
				case "books":
					return database.book.count({ where });
			}
			throw new Error("Unsupported content domain");
		},
		async resolve(owner, candidates) {
			const keys = (type: string) =>
				candidates.filter((c) => c.type === type).map((c) => c.key);
			const [articles, notes, books] = await Promise.all([
				database.article.findMany({
					where: { userId: owner, url: { in: keys("articles") } },
					include: { Category: { select: { id: true, name: true } } },
				}),
				database.note.findMany({
					where: { userId: owner, title: { in: keys("notes") } },
				}),
				database.book.findMany({
					where: { userId: owner, isbn: { in: keys("books") } },
				}),
			]);
			return [
				...articles.map((record) => ({
					key: record.url,
					hit: {
						id: record.id,
						type: "articles" as const,
						title: record.title,
						snippet: (record.quote ?? record.ogDescription ?? "").slice(0, 150),
						url: record.url,
						category: record.Category,
					},
				})),
				...notes.map((record) => ({
					key: record.title,
					hit: {
						id: record.id,
						type: "notes" as const,
						title: record.title,
						snippet: record.markdown.slice(0, 150),
					},
				})),
				...books.map((record) => ({
					key: record.isbn,
					hit: {
						id: record.id,
						type: "books" as const,
						title: record.title,
						snippet: (record.markdown ?? record.googleDescription ?? "").slice(
							0,
							150,
						),
						isbn: record.isbn,
						rating: record.rating,
						tags: record.tags,
					},
				})),
			];
		},
	};
}
