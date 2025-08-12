import { cache } from "react";
import { booksRepository } from "@/features/books/repositories/books-repository";

export const getAllBooks = cache(booksRepository.findAll);

export const getBooksCount = cache(booksRepository.count);
