import prisma from "@/prisma";
import { cache } from "react";

// Fetch all static contents for RAG knowledge base
const _getAllStaticContentsForKnowledge = async () => {
	return await prisma.staticContents.findMany({
		select: { title: true, markdown: true },
		cacheStrategy: { ttl: 400, tags: ["staticContents"] },
	});
};

export const getAllStaticContentsForKnowledge = cache(
	_getAllStaticContentsForKnowledge,
);

// Fetch all static books for RAG knowledge base
const _getAllStaticBooksForKnowledge = async () => {
	return await prisma.staticBooks.findMany({
		select: { title: true, markdown: true },
		cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
	});
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
	return await prisma.staticContents.findUnique({
		where: { title },
		select: { title: true, markdown: true },
		cacheStrategy: { ttl: 400, tags: ["staticContents"] },
	});
}

// Fetch a specific book by title
export async function fetchBookByTitle(title: string) {
	return await prisma.staticBooks.findUnique({
		where: { title },
		select: { title: true, markdown: true },
		cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
	});
}
