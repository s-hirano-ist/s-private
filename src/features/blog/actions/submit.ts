"use server";
import { blogSchema } from "../schemas/blog-schema";

export async function submitBlog(_: string, formData: FormData) {
	console.log(
		"form",
		formData.get("title"),
		formData.get("quote"),
		formData.get("url"),
	);
	const validatedFields = blogSchema.safeParse({
		title: formData.get("title"),
		quote: formData.get("quote"),
		url: formData.get("url"),
	});

	if (!validatedFields.success) {
		return "ERROR";
	}
	//TODO: submit form

	return "";
}
