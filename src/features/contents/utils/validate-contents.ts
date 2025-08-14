import "server-only";
import { contentsSchema } from "@/features/contents/schemas/contents-schema";
import { InvalidFormatError } from "@/utils/error/error-classes";

export function validateContents(formData: FormData) {
	const contentsValidatedFields = contentsSchema.safeParse({
		title: formData.get("title"),
		markdown: formData.get("markdown"),
	});
	if (!contentsValidatedFields.success) throw new InvalidFormatError();

	return contentsValidatedFields.data;
}
