import "server-only";
import { newsFormSchema } from "@/domains/news/news-schema";
import { InvalidFormatError } from "@/utils/error/error-classes";

export function validateNews(formData: FormData, userId: string) {
	const newsValidatedFields = newsFormSchema.safeParse({
		title: formData.get("title"),
		quote: formData.get("quote"),
		url: formData.get("url"),
		categoryName: formData.get("category"),
		userId,
	});
	if (!newsValidatedFields.success) throw new InvalidFormatError();

	return newsValidatedFields.data;
}
