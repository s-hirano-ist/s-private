"use server";
import "server-only";
import { SUCCESS_MESSAGES } from "@/constants";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getUserId,
	hasSelfPostPermissionOrThrow,
} from "@/features/auth/utils/get-session";
import type { Contents } from "@/features/contents/types";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction } from "@/types";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatCreateContentsMessage } from "@/utils/format-for-line";
import { revalidatePath } from "next/cache";

export async function addContents(
	formData: FormData,
): Promise<ServerAction<Contents>> {
	try {
		await hasSelfPostPermissionOrThrow();

		const userId = await getUserId();

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
		await sendLineNotifyMessage(message);
		revalidatePath("/(dumper)/");

		return {
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: createdContents,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
