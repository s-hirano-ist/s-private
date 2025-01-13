"use server";
import "server-only";
import { SUCCESS_MESSAGES } from "@/constants";
import { NotAllowedError, UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/features/auth/utils/role";
import type { Status, UpdateOrRevert } from "@/features/dump/types";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction } from "@/types";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatChangeStatusMessage } from "@/utils/format-for-line";
import { revalidatePath } from "next/cache";

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
		case "UPDATE":
			return await updateSelfContentsStatus();
		case "REVERT":
			return await revertSelfContentsStatus();
		default:
			changeType satisfies never;
			throw new UnexpectedError();
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
		await sendLineNotifyMessage(message);
		revalidatePath("/(dumper)");

		return { success: true, message: SUCCESS_MESSAGES.UPDATE, data: message };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
