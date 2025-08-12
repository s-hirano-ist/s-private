import { knowledgeRepository } from "@/features/ai/repositories/knowledge-repository";

// Fetch all contents for RAG knowledge base
export const getAllContentsForKnowledge = knowledgeRepository.findAllContents;

// Fetch all books for RAG knowledge base
export const getAllBooksForKnowledge = knowledgeRepository.findAllBooks;

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

// Fetch a specific content by title
export async function fetchContentByTitle(title: string) {
	return await knowledgeRepository.findContentByTitle(title);
}
