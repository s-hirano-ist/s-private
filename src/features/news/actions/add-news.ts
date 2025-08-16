"use server";
import "server-only";
import { revalidatePath } from "next/cache";
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

		// Extract form data directly
		const title = formData.get("title") as string;
		const quote = formData.get("quote") as string;
		const url = formData.get("url") as string;
		const categoryName = formData.get("category") as string;

		// Use new domain service method
		const newsEntity = await new NewsDomainService(
			newsQueryRepository,
		).validateAndCreateNews({
			title,
			url,
			quote: quote || null,
			categoryName,
			userId,
		});

		await newsCommandRepository.create(newsEntity);

		revalidatePath("/(dumper)");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
