import prisma from "@/prisma";
import { createArticlesQueryRepositories } from "@s-hirano-ist/s-backend/articles/query-repository";
export const { articlesQueryRepository, categoryQueryRepository } =
	createArticlesQueryRepositories(prisma);
