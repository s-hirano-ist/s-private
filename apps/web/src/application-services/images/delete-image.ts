"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { backendActionError } from "@/common/backend/action-error";
import { getBackendClient } from "@/common/backend/server-client";
import { refresh } from "next/cache";
export async function deleteImage(id: string): Promise<ServerAction> {
	try {
		await (await getBackendClient()).deleteImages(id);
		refresh();
		return { success: true, message: "deleted" };
	} catch (error) {
		return backendActionError(error);
	}
}
