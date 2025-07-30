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
import { contents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ServerAction } from "@/types";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { formatChangeStatusMessage } from "@/utils/format-for-notification";

async function updateSelfContentsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await db.transaction(async (tx) => {
		const exportedData = await tx
			.update(contents)
			.set({ status: "EXPORTED" })
			.where(and(eq(contents.status, "UPDATED_RECENTLY"), eq(contents.userId, userId)))
			.returning({ id: contents.id });
		const recentlyUpdatedData = await tx
			.update(contents)
			.set({ status: "UPDATED_RECENTLY" })
			.where(and(eq(contents.status, "UNEXPORTED"), eq(contents.userId, userId)))
			.returning({ id: contents.id });
		return {
			unexported: 0,
			recentlyUpdated: recentlyUpdatedData.length,
			exported: exportedData.length,
		};
	});
}

async function revertSelfContentsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await db.transaction(async (tx) => {
		const unexportedData = await tx
			.update(contents)
			.set({ status: "UNEXPORTED" })
			.where(and(eq(contents.status, "UPDATED_RECENTLY"), eq(contents.userId, userId)))
			.returning({ id: contents.id });
		const recentlyUpdatedData = await tx
			.update(contents)
			.set({ status: "UPDATED_RECENTLY" })
			.where(and(eq(contents.status, "EXPORTED"), eq(contents.userId, userId)))
			.returning({ id: contents.id });
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
			return await updateSelfContentsStatus();
		}
		case "REVERT": {
			return await revertSelfContentsStatus();
		}
		default: {
			changeType satisfies never;
			throw new UnexpectedError();
		}
	}
};

type ToastMessage = string;

export async function changeContentsStatus(
	changeType: UpdateOrRevert,
): Promise<ServerAction<ToastMessage>> {
	try {
		const hasUpdateStatusPermission = await hasDumperPostPermission();
		if (!hasUpdateStatusPermission) throw new NotAllowedError();

		const status = await handleStatusChange(changeType);

		const message = formatChangeStatusMessage(status, "CONTENTS");
		loggerInfo(message, {
			caller: "changeContentsStatus",
			status: 200,
		});
		await sendPushoverMessage(message);
		revalidatePath("/(dumper)");

		return { success: true, message: "updated", data: message };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
