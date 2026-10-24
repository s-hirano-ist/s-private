import prisma from "@/prisma";
import { createNotesQueryRepository } from "@s-hirano-ist/s-backend/notes/query-repository";
export const notesQueryRepository = createNotesQueryRepository(prisma);
