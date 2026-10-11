import prisma from "@/prisma";
import { createMobilePersistence } from "@s-hirano-ist/s-backend/mobile/prisma-persistence";
export const prismaMobilePersistence = createMobilePersistence(prisma);
