"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { newsEntity } from "@/domains/news/entities/news-entity";
import { NewsDomainService } from "@/domains/news/services/news-domain-service";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";
import { newsQueryRepository } from "@/infrastructures/news/repositories/news-query-repository";
import { parseAddNewsFormData } from "./helpers/form-data-parser";

export async function addNews(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const newsDomainService = new NewsDomainService(newsQueryRepository);

	try {
		const { title, quote, url, categoryName, userId } = parseAddNewsFormData(
			formData,
			await getSelfId(),
		);

		// Domain business rule validation
		await newsDomainService.ensureNoDuplicate(url, userId);

		// Create entity with value objects
		const news = newsEntity.create({
			title,
			quote,
			url,
			categoryName,
			userId,
		});

		// Persist
		await newsCommandRepository.create(news);

		revalidateTag(`news_UNEXPORTED_${userId}`);
		revalidateTag(`news_count_UNEXPORTED_${userId}`);

		revalidateTag("categories");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
