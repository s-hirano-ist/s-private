import type { EventDispatcher } from "@s-hirano-ist/s-backend/shared/ports";
import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import type { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import type { CategoryService } from "@s-hirano-ist/s-core/articles/services/category-service";
import {
	articleEntity,
	makeArticleTitle,
	makeCategoryName,
	makeQuote,
	makeUrl,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import { ArticleDeletedEvent } from "@s-hirano-ist/s-core/articles/events/article-deleted-event";
import {
	makeUnexportedStatus,
	type Id,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

export type ArticleInput = {
	category: string;
	quote: string;
	title: string;
	url: string;
};
export function parseArticleInput(input: ArticleInput, userId: UserId) {
	return {
		title: makeArticleTitle(input.title),
		quote: makeQuote(input.quote),
		url: makeUrl(input.url),
		categoryName: makeCategoryName(input.category),
		userId,
	};
}
export type DeleteArticleDeps = {
	commandRepository: IArticlesCommandRepository;
	eventDispatcher: EventDispatcher;
};
export type CreateArticleDeps = DeleteArticleDeps & {
	domainServiceFactory: {
		createArticlesDomainService(): Pick<
			ArticlesDomainService,
			"ensureNoDuplicate"
		>;
		createCategoryService(): Pick<CategoryService, "resolveOrCreate">;
	};
};

/** Authentication supplies the owner; this use case has no session or framework dependency. */
export async function createArticle(
	data: ReturnType<typeof parseArticleInput>,
	deps: CreateArticleDeps,
) {
	const service = deps.domainServiceFactory.createArticlesDomainService();
	const categories = deps.domainServiceFactory.createCategoryService();
	await service.ensureNoDuplicate(data.url, data.userId);
	const categoryId = await categories.resolveOrCreate(
		data.categoryName,
		data.userId,
	);
	const [article, event] = articleEntity.create({
		...data,
		categoryId,
		caller: "addArticle",
	});
	await deps.commandRepository.create(article);
	await deps.eventDispatcher.dispatch(event);
	return { id: article.id };
}
export async function deleteArticle(
	id: Id,
	userId: UserId,
	deps: DeleteArticleDeps,
): Promise<void> {
	const { title } = await deps.commandRepository.deleteById(
		id,
		userId,
		makeUnexportedStatus(),
	);
	await deps.eventDispatcher.dispatch(
		new ArticleDeletedEvent({ title, userId, caller: "deleteArticle" }),
	);
}
