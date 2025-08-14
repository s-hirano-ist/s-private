"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { contentsCommandRepository } from "@/infrastructures/contents/repositories/contents-command-repository";
import { serverLogger } from "@/o11y/server";
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
		const validatedContents = validateContents(formData);

		const createdContents = await contentsCommandRepository.create({
			userId,
			...validatedContents,
		});

		serverLogger.info(
			`【CONTENTS】\n\nコンテンツ\ntitle: ${createdContents.title} \nquote: ${createdContents.markdown}\nの登録ができました`,
			{ caller: "addContents", status: 201, userId },
			{ notify: true },
		);
		revalidatePath("/(dumper)");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
