import { cache } from "react";
import db from "@/db";
import { staticContents, staticBooks } from "@/db/schema";
import { eq } from "drizzle-orm";

// Fetch all static contents for RAG knowledge base
const _getAllStaticContentsForKnowledge = async () => {
	return await db
		.select({
			title: staticContents.title,
			markdown: staticContents.markdown,
		})
		.from(staticContents);
};

export const getAllStaticContentsForKnowledge = cache(
	_getAllStaticContentsForKnowledge,
);

// Fetch all static books for RAG knowledge base
const _getAllStaticBooksForKnowledge = async () => {
	return await db
		.select({
			title: staticBooks.title,
			markdown: staticBooks.markdown,
		})
		.from(staticBooks);
};

export const getAllStaticBooksForKnowledge = cache(
	_getAllStaticBooksForKnowledge,
);

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
		})),
		...books.map((book) => ({
			id: `book-${book.title}`,
			title: book.title,
			content: book.markdown,
			type: "book" as const,
		})),
	];
}

// Fetch a specific content by title
export async function fetchContentByTitle(title: string) {
	const [result] = await db
		.select({
			title: staticContents.title,
			markdown: staticContents.markdown,
		})
		.from(staticContents)
		.where(eq(staticContents.title, title))
		.limit(1);
	return result || null;
}
