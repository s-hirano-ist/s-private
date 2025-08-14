import "server-only";
import { categorySchema } from "@/features/news/schemas/category-schema";
import { InvalidFormatError } from "@/utils/error/error-classes";

export function validateCategory(formData: FormData) {
	const categoryValidatedFields = categorySchema.safeParse({
		name: formData.get("category"),
	});
	if (!categoryValidatedFields.success) throw new InvalidFormatError();

	return categoryValidatedFields.data;
}
