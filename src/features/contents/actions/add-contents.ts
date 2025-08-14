"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { contentsCommandRepository } from "@/features/contents/repositories/contents-command-repository";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { serverLogger } from "@/o11y/server";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { formatCreateContentsMessage } from "@/utils/notification/format-for-notification";

type Contents = {
	id: string;
	markdown: string;
	title: string;
};

export async function addContents(
	formData: FormData,
): Promise<ServerAction<Contents>> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();
		const validatedContents = validateContents(formData);

		const createdContents = await contentsCommandRepository.create({
			userId,
			...validatedContents,
		});
		const message = formatCreateContentsMessage({
			title: createdContents.title,
			markdown: createdContents.markdown,
		});
		const context = {
			caller: "addContents" as const,
			status: 201 as const,
			userId,
		};
		serverLogger.info(message, context, { notify: true });
		revalidatePath("/(dumper)");

		return {
			success: true,
			message: "inserted",
			data: {
				id: createdContents.id,
				title: createdContents.title,
				markdown: createdContents.markdown,
			},
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
