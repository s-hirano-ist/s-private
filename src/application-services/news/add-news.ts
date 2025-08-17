"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { NewsDomainService } from "@/domains/news/services/news-domain-service";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";
import { newsQueryRepository } from "@/infrastructures/news/repositories/news-query-repository";

export async function addNews(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const validatedNews = await new NewsDomainService(
			newsQueryRepository,
		).prepareNewNews(formData, userId);

		await newsCommandRepository.create(validatedNews);

		revalidateTag(`news_UNEXPORTED_${userId}`);
		revalidateTag("categories");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
