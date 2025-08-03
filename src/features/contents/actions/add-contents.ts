"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
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

		const createdContents = await prisma.contents.create({
			data: { userId, ...validateContents(formData) },
			select: {
				id: true,
				title: true,
				quote: true,
				url: true,
			},
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
			data: createdContents,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
