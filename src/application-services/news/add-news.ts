"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { withPermissionCheck } from "@/common/auth/permission-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { NewsDomainService } from "@/domains/news/services/news-domain-service";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";
import { newsQueryRepository } from "@/infrastructures/news/repositories/news-query-repository";

async function addNewsImpl(formData: FormData): Promise<ServerAction> {
	const userId = await getSelfId();

	const validatedNews = await new NewsDomainService(
		newsQueryRepository,
	).prepareNewNews(formData, userId);

	await newsCommandRepository.create(validatedNews);

	revalidateTag(`news_UNEXPORTED_${userId}`);
	revalidateTag(`news_count_UNEXPORTED_${userId}`);

	revalidateTag("categories");

	return { success: true, message: "inserted" };
}

export const addNews = withPermissionCheck(
	hasDumperPostPermission,
	addNewsImpl,
);
