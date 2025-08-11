import { knowledgeRepository } from "@/features/ai/repositories/knowledge-repository";

// Fetch all static contents for RAG knowledge base
export const getAllStaticContentsForKnowledge =
	knowledgeRepository.findAllStaticContents;

// Fetch all static books for RAG knowledge base
export const getAllStaticBooksForKnowledge =
	knowledgeRepository.findAllStaticBooks;

// Fetch all knowledge (both contents and books)
export async function fetchAllKnowledge() {
	const contents = await getAllStaticContentsForKnowledge();
	const books = await getAllStaticBooksForKnowledge();

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

// Fetch a specific content by title
export async function fetchContentByTitle(title: string) {
	return await knowledgeRepository.findStaticContentByTitle(title);
}
