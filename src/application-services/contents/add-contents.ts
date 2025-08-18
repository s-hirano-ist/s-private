"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { contentEntity } from "@/domains/contents/entities/contents-entity";
import { ContentsDomainService } from "@/domains/contents/services/contents-domain-service";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";
import { parseAddContentFormData } from "./helpers/form-data-parser";

export async function addContent(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const contentsDomainService = new ContentsDomainService(
		contentsQueryRepository,
	);

	try {
		const { title, markdown, userId } = parseAddContentFormData(
			formData,
			await getSelfId(),
		);

		// Domain business rule validation
		await contentsDomainService.ensureNoDuplicate(title, userId);

		// Create entity with value objects
		const contents = contentEntity.create({ title, markdown, userId });

		// Persist
		await contentsCommandRepository.create(contents);

		// Cache invalidation
		revalidateTag(`contents_UNEXPORTED_${userId}`);
		revalidateTag(`contents_count_UNEXPORTED_${userId}`);

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
