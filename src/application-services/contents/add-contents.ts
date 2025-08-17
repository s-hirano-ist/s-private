"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { ContentsDomainService } from "@/domains/contents/services/contents-domain-service";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";

export type Contents = {
	id: string;
	markdown: string;
	title: string;
};

export async function addContents(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const validatedContents = await new ContentsDomainService(
			contentsQueryRepository,
		).prepareNewContents(formData, userId);

		await contentsCommandRepository.create(validatedContents);

		revalidateTag("contents_UNEXPORTED");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
