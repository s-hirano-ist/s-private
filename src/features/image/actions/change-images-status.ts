"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { imageRepository } from "@/features/image/repositories/image-repository";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction, Status, UpdateOrRevert } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { formatChangeStatusMessage } from "@/utils/notification/format-for-notification";

async function updateSelfImagesStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await prisma.$transaction(async () => {
		const exportedCount = await imageRepository.updateManyStatus(
			userId,
			"UPDATED_RECENTLY",
			"EXPORTED",
		);
		const recentlyUpdatedCount = await imageRepository.updateManyStatus(
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

async function revertSelfImagesStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await prisma.$transaction(async () => {
		const unexportedCount = await imageRepository.updateManyStatus(
			userId,
			"UPDATED_RECENTLY",
			"UNEXPORTED",
		);
		const recentlyUpdatedCount = await imageRepository.updateManyStatus(
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
			return await updateSelfImagesStatus();
		}
		case "REVERT": {
			return await revertSelfImagesStatus();
		}
		default: {
			changeType satisfies never;
			throw new UnexpectedError();
		}
	}
};

type ToastMessage = string;

export async function changeImagesStatus(
	changeType: UpdateOrRevert,
): Promise<ServerAction<ToastMessage>> {
	const hasUpdateStatusPermission = await hasDumperPostPermission();
	if (!hasUpdateStatusPermission) forbidden();

	try {
		const status = await handleStatusChange(changeType);

		const message = formatChangeStatusMessage(status, "IMAGES");
		loggerInfo(message, {
			caller: "changeImagesStatus",
			status: 200,
		});
		await sendPushoverMessage(message);
		revalidatePath("/(dumper)");

		return { success: true, message: "updated", data: message };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
