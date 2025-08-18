"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	makeId,
	makeStatus,
	makeUserId,
} from "@/domains/common/entities/common-entity";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";

export async function deleteNote(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		await notesCommandRepository.deleteById(
			makeId(id),
			makeUserId(userId),
			makeStatus("UNEXPORTED"),
		);

		revalidateTag(`notes_UNEXPORTED_${userId}`);
		revalidateTag(`notes_count_UNEXPORTED_${userId}`);

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
