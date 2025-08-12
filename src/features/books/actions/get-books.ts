import { cache } from "react";
import { booksQueryRepository } from "@/features/books/repositories/books-query-repository";

export const getAllBooks = cache(booksQueryRepository.findAll);

export const getBooksCount = cache(booksQueryRepository.count);
