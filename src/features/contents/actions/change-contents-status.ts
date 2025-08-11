"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { contentsRepository } from "@/features/contents/repositories/contents-repository";
import { loggerInfo } from "@/pino";
import type { ServerAction, Status, UpdateOrRevert } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { formatChangeStatusMessage } from "@/utils/notification/format-for-notification";

async function updateSelfContentsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await contentsRepository.transaction(async () => {
		const exportedCount = await contentsRepository.updateManyStatus(
			userId,
			"UPDATED_RECENTLY",
			"EXPORTED",
		);
		const recentlyUpdatedCount = await contentsRepository.updateManyStatus(
			userId,
			"UNEXPORTED",
			"UPDATED_RECENTLY",
		);
		return {
			unexported: 0,
			recentlyUpdated: recentlyUpdatedCount,
			exported: exportedCount,
		};
	});
}

async function revertSelfContentsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await contentsRepository.transaction(async () => {
		const unexportedCount = await contentsRepository.updateManyStatus(
			userId,
			"UPDATED_RECENTLY",
			"UNEXPORTED",
		);
		const recentlyUpdatedCount = await contentsRepository.updateManyStatus(
			userId,
			"EXPORTED",
			"UPDATED_RECENTLY",
		);
		return {
			unexported: unexportedCount,
			recentlyUpdated: recentlyUpdatedCount,
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
	const hasUpdateStatusPermission = await hasDumperPostPermission();
	if (!hasUpdateStatusPermission) forbidden();

	try {
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
