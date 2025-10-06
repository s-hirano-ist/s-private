"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import {
	makeId,
	makeUnexportedStatus,
} from "s-private-domains/common/entities/common-entity";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";

export async function deleteNote(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const status = makeUnexportedStatus();
		await notesCommandRepository.deleteById(makeId(id), userId, status);

		revalidateTag(buildContentCacheTag("notes", status, userId));
		revalidateTag(buildCountCacheTag("notes", status, userId));

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
