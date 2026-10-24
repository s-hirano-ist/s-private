import prisma from "@/prisma";
import { createImagesQueryRepository } from "@s-hirano-ist/s-backend/images/query-repository";
export const imagesQueryRepository = createImagesQueryRepository(prisma);
