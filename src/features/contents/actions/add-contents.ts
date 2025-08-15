"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { ContentsDomainService } from "@/domains/contents/services/contents-domain-service";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { wrapServerSideErrorForClient } from "@/utils/error/error-wrapper";
import type { ServerAction } from "@/utils/types";

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

		revalidatePath("/(dumper)");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
