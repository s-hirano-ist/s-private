"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { DomainEventFactory, EventPublisher } from "@/domains/common/events";
import {
	type NewsDomainDeps,
	newsDomainOperations,
} from "@/domains/news/services/news-domain-service";
import { CategoryName, NewsTitle, NewsUrl } from "@/domains/news/value-objects";
import { categoryCommandRepository } from "@/infrastructures/news/repositories/category-command-repository";
import { newsCommandRepository } from "@/infrastructures/news/repositories/news-command-repository";
import {
	categoryQueryRepository,
	newsQueryRepository,
} from "@/infrastructures/news/repositories/news-query-repository";

export async function addNews(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	// Create dependencies for functional approach
	const deps: NewsDomainDeps = {
		newsCommandRepository,
		newsQueryRepository,
		categoryCommandRepository,
		categoryQueryRepository,
	};

	// Use the functional domain operations
	const newsResult = await newsDomainOperations.validateNewNews(
		formData,
		userId,
		deps,
	);

	if (newsResult.isFailure) {
		return await wrapServerSideErrorForClient(newsResult, formData);
	}

	const news = newsResult.value;

	// Save the news using functional repository
	const saveResult = await newsCommandRepository.save(news);

	if (saveResult.isFailure) {
		return await wrapServerSideErrorForClient(saveResult, formData);
	}

	// Publish domain event
	const newsCreatedEvent = DomainEventFactory.newsCreated(
		news.id,
		news.userId,
		{
			title: NewsTitle.unwrap(news.title),
			url: NewsUrl.unwrap(news.url),
			categoryName: CategoryName.unwrap(news.category.name),
		},
	);

	await EventPublisher.publish(newsCreatedEvent);

	// Revalidate cache
	revalidateTag(`news_UNEXPORTED_${userId}`);
	revalidateTag(`news_count_UNEXPORTED_${userId}`);
	revalidateTag("categories");

	return { success: true, message: "inserted" };
}
