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

async function updateSelfNewsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await prisma.$transaction(async (prisma) => {
		const exportedData = await prisma.news.updateMany({
			where: { status: "UPDATED_RECENTLY", userId },
			data: { status: "EXPORTED" },
		});
		const recentlyUpdatedData = await prisma.news.updateMany({
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

async function revertSelfNewsStatus(): Promise<Status> {
	const userId = await getSelfId();

	return await prisma.$transaction(async (prisma) => {
		const unexportedData = await prisma.news.updateMany({
			where: { status: "UPDATED_RECENTLY", userId },
			data: { status: "UNEXPORTED" },
		});
		const recentlyUpdatedData = await prisma.news.updateMany({
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
