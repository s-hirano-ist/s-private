import "server-only";
import { v7 as uuidv7 } from "uuid";
import type { INewsQueryRepository } from "@/domains/news/types";
import {
	DuplicateError,
	InvalidFormatError,
} from "@/utils/error/error-classes";
import { type NewsFormSchema, newsFormSchema } from "../entities/news-entity";

export async function validateNews(
	formData: FormData,
	userId: string,
	newsQueryRepository: INewsQueryRepository,
): Promise<NewsFormSchema> {
	const generatedId = uuidv7();

	const formValues = {
		title: formData.get("title"),
		quote: formData.get("quote"),
		url: formData.get("url"),
		categoryName: formData.get("category"),
		userId,
		id: generatedId,
	};

	const newsValidatedFields = newsFormSchema.safeParse(formValues);
	if (!newsValidatedFields.success) throw new InvalidFormatError();

	const response = await newsQueryRepository.findByUrl(
		newsValidatedFields.data.url,
		userId,
	);
	if (response !== null) throw new DuplicateError();

	return newsValidatedFields.data;
}
