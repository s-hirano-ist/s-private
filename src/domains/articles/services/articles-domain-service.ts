import { DuplicateError, UnexpectedError } from "@/common/error/error-classes";
import type { IArticlesQueryRepository } from "@/domains/articles/repositories/articles-query-repository.interface";
import {
	makeUserId,
	type UserId,
} from "@/domains/common/entities/common-entity";
import {
	type ArticleTitle,
	articleEntity,
	type CategoryName,
	makeUrl,
	type OgDescription,
	type OgImageUrl,
	type OgTitle,
	type Quote,
	UnexportedArticle,
	type Url,
} from "../entities/article-entity";

async function ensureNoDuplicateArticle(
	articlesQueryRepository: IArticlesQueryRepository,
	url: Url,
	userId: UserId,
): Promise<void> {
	const exists = await articlesQueryRepository.findByUrl(url, userId);
	if (exists !== null) {
		throw new DuplicateError();
	}
}

type ArticleStatus = "NEED_CREATE" | "NEED_UPDATE";
type ReturnType =
	| { status: ArticleStatus; data: UnexportedArticle }
	| { status: "NO_UPDATE" };

async function updateArticle(
	articlesQueryRepository: IArticlesQueryRepository,
	url: Url,
	categoryName: CategoryName,
	userId: UserId,
	title: ArticleTitle,
	quote: Quote,
	ogTitle: OgTitle,
	ogDescription: OgDescription,
	ogImageUrl: OgImageUrl,
): Promise<ReturnType> {
	const data = await articlesQueryRepository.findByUrl(
		makeUrl(url),
		makeUserId(userId),
	);
	if (data?.status !== "UNEXPORTED") return { status: "NO_UPDATE" };

	if (!data) {
		return {
			status: "NEED_CREATE",
			data: articleEntity.create({
				userId,
				title,
				quote,
				url,
				categoryName,
			}),
		};
	}
	const newData = UnexportedArticle.safeParse(data);
	if (!newData.success) throw new UnexpectedError();

	if (
		data.title !== title ||
		data.quote !== quote ||
		data.ogTitle !== ogTitle ||
		data.ogDescription !== ogDescription ||
		data.ogImageUrl !== ogImageUrl
	) {
		return {
			status: "NEED_UPDATE",
			data: articleEntity.update(newData.data, {
				title,
				quote,
				ogTitle,
				ogDescription,
				ogImageUrl,
			}),
		};
	}
	return { status: "NO_UPDATE" };
}

export class ArticlesDomainService {
	constructor(
		private readonly articlesQueryRepository: IArticlesQueryRepository,
	) {}

	public async ensureNoDuplicate(url: Url, userId: UserId) {
		return ensureNoDuplicateArticle(this.articlesQueryRepository, url, userId);
	}

	public async updateArticle(
		url: Url,
		categoryName: CategoryName,
		userId: UserId,
		title: ArticleTitle,
		quote: Quote,
		ogTitle: OgTitle,
		ogDescription: OgDescription,
		ogImageUrl: OgImageUrl,
	) {
		return updateArticle(
			this.articlesQueryRepository,
			url,
			categoryName,
			userId,
			title,
			quote,
			ogTitle,
			ogDescription,
			ogImageUrl,
		);
	}
}
