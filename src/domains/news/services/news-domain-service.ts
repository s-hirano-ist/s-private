import "server-only";
import {
	DuplicateError,
	InvalidFormatError,
} from "@/common/error/error-classes";
import {
	makeStatus,
	makeUserId,
} from "@/domains/common/entities/common-entity";
import type { INewsQueryRepository } from "@/domains/news/types";
import { type NewsFormSchema, newsFormSchema } from "../entities/news-entity";

export class NewsDomainService {
	constructor(private readonly newsQueryRepository: INewsQueryRepository) {}

	public async prepareNewNews(
		formData: FormData,
		userId: string,
	): Promise<NewsFormSchema> {
		const formValues = {
			title: formData.get("title") as string,
			quote: formData.get("quote") as string,
			url: formData.get("url") as string,
			category: {
				name: formData.get("category") as string,
				userId: makeUserId(userId),
			},
			userId: makeUserId(userId),
			status: makeStatus("UNEXPORTED"),
		} satisfies Omit<NewsFormSchema, "category" | "id"> & {
			category: Omit<NewsFormSchema["category"], "id">;
		};

		const newsValidatedFields = newsFormSchema.safeParse(formValues);
		if (!newsValidatedFields.success) throw new InvalidFormatError();

		// check duplicate
		const exists = await this.newsQueryRepository.findByUrl(
			newsValidatedFields.data.url,
			userId,
		);
		if (exists !== null) throw new DuplicateError();

		return newsValidatedFields.data;
	}
}
