import { cache } from "react";
import { knowledgeQueryRepository } from "@/features/ai/repositories/knowledge-query-repository";
import { getSelfId } from "@/utils/auth/session";

// FIXME: TODO: do not export status

export const getAllContentsForKnowledge = cache(async () => {
	const userId = await getSelfId();
	return await knowledgeQueryRepository.findAllContents(userId, "EXPORTED");
});

export const getAllBooksForKnowledge = cache(async () => {
	const userId = await getSelfId();
	return await knowledgeQueryRepository.findAllBooks(userId, "EXPORTED");
});

// Fetch all knowledge (both contents and books)
export async function fetchAllKnowledge() {
	const contents = await getAllContentsForKnowledge();
	const books = await getAllBooksForKnowledge();

	return [
		...contents.map((content) => ({
			id: `content-${content.title}`,
			title: content.title,
			content: content.markdown,
			type: "content" as const,
			href: `/content/${content.title}`,
		})),
		...books.map((book) => ({
			id: `book-${book.title}`,
			title: book.title,
			content: book.markdown,
			type: "book" as const,
			href: `/book/${book.ISBN}`,
		})),
	];
}
