import prisma from "@/prisma";
import { createBooksQueryRepository } from "@s-hirano-ist/s-backend/books/query-repository";
export const booksQueryRepository = createBooksQueryRepository(prisma);
