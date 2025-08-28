import type { UserId } from "@/domains/common/entities/common-entity";
import {
	articleEntity,
	makeUrl,
	type UnexportedArticle,
} from "@/domains/articles/entities/article-entity";

type ArticlesExportRepository = {
	findUnexported(userId: UserId): Promise<
		Array<{ url: string; userId: string }>
	>;
	markAsExported(url: string, userId: UserId): Promise<void>;
};

export class ArticlesExportService {
	constructor(
		private readonly articlesExportRepository: ArticlesExportRepository,
	) {}

	public async exportUnexportedArticles(userId: UserId) {
		const unexportedArticles =
			await this.articlesExportRepository.findUnexported(userId);

		const exportResults = await Promise.all(
			unexportedArticles.map(async (article) => {
				const articleUrl = makeUrl(article.url);

				const unexportedArticle: UnexportedArticle = {
					id: "",
					userId,
					url: articleUrl,
					categoryName: "" as any,
					title: "" as any,
					status: "UNEXPORTED",
					createdAt: "",
				};

				const exportedArticle = articleEntity.export(unexportedArticle);

				await this.articlesExportRepository.markAsExported(articleUrl, userId);

				return exportedArticle;
			}),
		);

		return exportResults;
	}
}