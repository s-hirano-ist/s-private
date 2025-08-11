"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { contentsRepository } from "@/features/contents/repositories/contents-repository";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { loggerInfo } from "@/pino";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { formatCreateContentsMessage } from "@/utils/notification/format-for-notification";

type Contents = {
	id: number;
	quote: string | null;
	title: string;
	url: string;
};

export async function addContents(
	formData: FormData,
): Promise<ServerAction<Contents>> {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) forbidden();

	try {
		const userId = await getSelfId();
		const validatedContents = validateContents(formData);

		const createdContents = await contentsRepository.create({
			userId,
			title: validatedContents.title,
			url: validatedContents.url,
			quote: validatedContents.quote,
		});
		const message = formatCreateContentsMessage(createdContents);
		loggerInfo(message, {
			caller: "addContents",
			status: 200,
		});
		await sendPushoverMessage(message);
		revalidatePath("/(dumper)");

		return {
			success: true,
			message: "inserted",
			data: {
				id: createdContents.id,
				title: createdContents.title,
				quote: createdContents.quote,
				url: createdContents.url,
			},
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
