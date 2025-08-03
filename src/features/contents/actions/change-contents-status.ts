"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction, Status, UpdateOrRevert } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { formatChangeStatusMessage } from "@/utils/notification/format-for-notification";

async function updateSelfContentsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await prisma.$transaction(async (prisma) => {
		const exportedData = await prisma.contents.updateMany({
			where: { status: "UPDATED_RECENTLY", userId },
			data: { status: "EXPORTED" },
		});
		const recentlyUpdatedData = await prisma.contents.updateMany({
			where: { status: "UNEXPORTED", userId },
			data: { status: "UPDATED_RECENTLY" },
		});
		return {
			unexported: 0,
			recentlyUpdated: recentlyUpdatedData.count,
			exported: exportedData.count,
		};
	});
}

async function revertSelfContentsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await prisma.$transaction(async (prisma) => {
		const unexportedData = await prisma.contents.updateMany({
			where: { status: "UPDATED_RECENTLY", userId },
			data: { status: "UNEXPORTED" },
		});
		const recentlyUpdatedData = await prisma.contents.updateMany({
			where: { status: "EXPORTED", userId },
			data: { status: "UPDATED_RECENTLY" },
		});
		return {
			unexported: unexportedData.count,
			recentlyUpdated: recentlyUpdatedData.count,
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
