import { withMobileTenant } from "@/application-services/mobile/auth";
import {
	mobileErrorResponse,
	mobileJson,
} from "@/application-services/mobile/http";
import { searchContent } from "@/application-services/search/search-content";
import prisma from "@/prisma";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { z } from "zod";

const querySchema = z.object({
	query: z.string().trim().min(1).max(500),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request): Promise<Response> {
	try {
		const query = querySchema.parse(
			Object.fromEntries(new URL(request.url).searchParams),
		);
		return await withMobileTenant(request, async (userId) => {
			const found = await searchContent(
				{ query: query.query, limit: query.limit },
				makeUserId(userId),
			);
			const data = [];
			for (const item of found.results) {
				let owned: { id: string; snippet: string; title: string } | undefined;
				switch (item.contentType) {
					case "articles": {
						const article = await prisma.article.findFirst({
							where: { userId, url: item.url },
							select: { id: true, title: true, quote: true },
						});
						if (article)
							owned = {
								id: article.id,
								title: article.title,
								snippet: article.quote ?? "",
							};
						break;
					}
					case "books": {
						const book = await prisma.book.findFirst({
							where: { userId, isbn: item.href },
							select: {
								id: true,
								title: true,
								markdown: true,
								googleDescription: true,
							},
						});
						if (book)
							owned = {
								id: book.id,
								title: book.title,
								snippet: book.markdown ?? book.googleDescription ?? "",
							};
						break;
					}
					case "notes": {
						const note = await prisma.note.findFirst({
							where: { userId, title: decodeURIComponent(item.href) },
							select: { id: true, title: true, markdown: true },
						});
						if (note)
							owned = {
								id: note.id,
								title: note.title,
								snippet: note.markdown,
							};
						break;
					}
				}
				if (owned)
					data.push({
						...owned,
						snippet: owned.snippet.slice(0, 150),
						type: item.contentType,
					});
			}
			return mobileJson({ data, query: query.query });
		});
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
