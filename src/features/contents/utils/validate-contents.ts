import "server-only";
import { InvalidFormatError } from "@/error-classes";
import { contentsSchema } from "@/features/contents/schemas/contents-schema";

export function validateContents(formData: FormData) {
	const contentsValidatedFields = contentsSchema.safeParse({
		title: formData.get("title"),
		markdown: formData.get("quote"),
	});
	if (!contentsValidatedFields.success) throw new InvalidFormatError();

	return contentsValidatedFields.data;
}
