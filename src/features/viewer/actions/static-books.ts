import { staticBooksRepository } from "@/features/viewer/repositories/static-books-repository";

export const getAllStaticBooks = staticBooksRepository.findAll;

export const getStaticBooksCount = staticBooksRepository.count;
