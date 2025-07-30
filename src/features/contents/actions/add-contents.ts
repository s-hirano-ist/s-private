"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { NotAllowedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { validateContents } from "@/features/contents/utils/validate-contents";
import { loggerInfo } from "@/pino";
import db from "@/db";
import { contents } from "@/db/schema";
import type { ServerAction } from "@/types";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { formatCreateContentsMessage } from "@/utils/format-for-notification";

type Contents = {
	id: number;
	quote: string | null;
	title: string;
	url: string;
};

export async function addContents(
	formData: FormData,
): Promise<ServerAction<Contents>> {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) throw new NotAllowedError();

		const userId = await getSelfId();

		const [createdContents] = await db
			.insert(contents)
			.values({ userId, ...validateContents(formData) })
			.returning({
				id: contents.id,
				title: contents.title,
				quote: contents.quote,
				url: contents.url,
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
