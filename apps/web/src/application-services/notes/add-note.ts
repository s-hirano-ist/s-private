"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { backendActionError } from "@/common/backend/action-error";
import { getBackendClient } from "@/common/backend/server-client";
import { NoteCreate } from "@s-hirano-ist/s-api-client/models";
import { refresh } from "next/cache";
export async function addNote(formData: FormData): Promise<ServerAction> {
	try {
		const input = NoteCreate.parse({
			operationId: formData.get("operationId"),
			title: formData.get("title"),
			markdown: formData.get("markdown"),
		});
		await (await getBackendClient()).createNotes(input);
		refresh();
		return { success: true, message: "inserted" };
	} catch (error) {
		return backendActionError(error, formData);
	}
}
