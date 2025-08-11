import { staticBooksRepository } from "@/features/books/repositories/static-books-repository";

export const getAllStaticBooks = staticBooksRepository.findAll;

export const getStaticBooksCount = staticBooksRepository.count;
