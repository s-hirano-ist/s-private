"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { NotAllowedError, UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import type { Status, UpdateOrRevert } from "@/features/dump/types";
import { loggerInfo } from "@/pino";
import db from "@/db";
import { news } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ServerAction } from "@/types";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { formatChangeStatusMessage } from "@/utils/format-for-notification";

async function updateSelfNewsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await db.transaction(async (tx) => {
		const exportedData = await tx
			.update(news)
			.set({ status: "EXPORTED" })
			.where(and(eq(news.status, "UPDATED_RECENTLY"), eq(news.userId, userId)))
			.returning({ id: news.id });

		const recentlyUpdatedData = await tx
			.update(news)
			.set({ status: "UPDATED_RECENTLY" })
			.where(and(eq(news.status, "UNEXPORTED"), eq(news.userId, userId)))
			.returning({ id: news.id });

		return {
			unexported: 0,
			recentlyUpdated: recentlyUpdatedData.length,
			exported: exportedData.length,
		};
	});
}

async function revertSelfNewsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await db.transaction(async (tx) => {
		const unexportedData = await tx
			.update(news)
			.set({ status: "UNEXPORTED" })
			.where(and(eq(news.status, "UPDATED_RECENTLY"), eq(news.userId, userId)))
			.returning({ id: news.id });

		const recentlyUpdatedData = await tx
			.update(news)
			.set({ status: "UPDATED_RECENTLY" })
			.where(and(eq(news.status, "EXPORTED"), eq(news.userId, userId)))
			.returning({ id: news.id });

		return {
			unexported: unexportedData.length,
			recentlyUpdated: recentlyUpdatedData.length,
			exported: 0,
		};
	});
}

const handleStatusChange = async (changeType: UpdateOrRevert) => {
	switch (changeType) {
		case "UPDATE": {
			return await updateSelfNewsStatus();
		}
		case "REVERT": {
			return await revertSelfNewsStatus();
		}
		default: {
			changeType satisfies never;
			throw new UnexpectedError();
		}
	}
};

type ToastMessage = string;

export async function changeNewsStatus(
	updateOrRevert: UpdateOrRevert,
): Promise<ServerAction<ToastMessage>> {
	try {
		const hasUpdateStatusPermission = await hasDumperPostPermission();
		if (!hasUpdateStatusPermission) throw new NotAllowedError();

		const status = await handleStatusChange(updateOrRevert);
		const message = formatChangeStatusMessage(status, "NEWS");
		loggerInfo(message, {
			caller: "changeNewsStatus",
			status: 200,
		});
		await sendPushoverMessage(message);
		revalidatePath("/(dumper)");

		return { success: true, message: "updated", data: message };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
