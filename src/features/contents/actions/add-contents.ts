"use server";
import "server-only";
import { NotAllowedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction } from "@/types";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { formatCreateContentsMessage } from "@/utils/format-for-notification";
import { revalidatePath } from "next/cache";

type Contents = {
	id: number;
	title: string;
	quote: string | null;
	url: string;
};

export async function addContents(
	formData: FormData,
): Promise<ServerAction<Contents>> {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) throw new NotAllowedError();

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
