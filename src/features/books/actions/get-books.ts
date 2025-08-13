import { cache } from "react";
import { booksQueryRepository } from "@/features/books/repositories/books-query-repository";

export const getAllBooks = cache(booksQueryRepository.findAll);

export const getBooksCount = cache(booksQueryRepository.count);

export const getBookByISBN = cache(async (isbn: string) => {
	return await booksQueryRepository.findByISBN(isbn);
});
