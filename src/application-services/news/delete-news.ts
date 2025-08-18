"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { DomainEventFactory, EventPublisher } from "@/domains/common/events";
import type { NewsId } from "@/domains/news/entities/news-entity";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";

export async function deleteNews(id: NewsId): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	// Use functional repository
	const deleteResult = await newsCommandRepository.delete(
		id,
		userId,
		"UNEXPORTED",
	);

	if (deleteResult.isFailure) {
		return await wrapServerSideErrorForClient(deleteResult);
	}

	// Publish domain event
	const newsDeletedEvent = DomainEventFactory.newsDeleted(id, userId, {});

	await EventPublisher.publish(newsDeletedEvent);

	// Revalidate cache
	revalidateTag(`news_UNEXPORTED_${userId}`);
	revalidateTag(`news_count_UNEXPORTED_${userId}`);

	return { success: true, message: "deleted" };
}
