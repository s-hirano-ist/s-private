import "server-only";
import { InvalidFormatError } from "@/error-classes";
import { categorySchema } from "@/features/news/schemas/category-schema";

export function validateCategory(formData: FormData) {
	const categoryValidatedFields = categorySchema.safeParse({
		name: formData.get("category"),
	});
	if (!categoryValidatedFields.success) throw new InvalidFormatError();

	return categoryValidatedFields.data;
}
