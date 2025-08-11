"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { newsRepository } from "@/features/news/repositories/news-repository";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction, Status, UpdateOrRevert } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { formatChangeStatusMessage } from "@/utils/notification/format-for-notification";

async function updateSelfNewsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await prisma.$transaction(async () => {
		const exportedCount = await newsRepository.updateManyStatus(
			userId,
			"UPDATED_RECENTLY",
			"EXPORTED",
		);
		const recentlyUpdatedCount = await newsRepository.updateManyStatus(
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

async function revertSelfNewsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await prisma.$transaction(async () => {
		const unexportedCount = await newsRepository.updateManyStatus(
			userId,
			"UPDATED_RECENTLY",
			"UNEXPORTED",
		);
		const recentlyUpdatedCount = await newsRepository.updateManyStatus(
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
	const hasUpdateStatusPermission = await hasDumperPostPermission();
	if (!hasUpdateStatusPermission) forbidden();

	try {
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
