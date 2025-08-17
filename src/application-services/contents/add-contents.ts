"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { withPermissionCheck } from "@/common/auth/permission-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { ContentsDomainService } from "@/domains/contents/services/contents-domain-service";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";

export type Contents = {
	id: string;
	markdown: string;
	title: string;
};

async function addContentsImpl(formData: FormData): Promise<ServerAction> {
	const userId = await getSelfId();

	const validatedContents = await new ContentsDomainService(
		contentsQueryRepository,
	).prepareNewContents(formData, userId);

	await contentsCommandRepository.create(validatedContents);

	revalidateTag(`contents_UNEXPORTED_${userId}`);
	revalidateTag(`contents_count_UNEXPORTED_${userId}`);

	return { success: true, message: "inserted" };
}

export const addContents = withPermissionCheck(
	hasDumperPostPermission,
	addContentsImpl,
);
