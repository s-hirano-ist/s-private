"use server";
import { blogSchema } from "../schemas/blog-schema";

export type SubmitBlogState = {
	success: boolean | undefined;
	message: string;
};

export async function submitBlog(_: SubmitBlogState, formData: FormData) {
	try {
		console.log("submit form", formData);
		const validatedFields = blogSchema.safeParse({
			title: formData.get("title"),
			quote: formData.get("quote"),
			url: formData.get("url"),
		});

		if (!validatedFields.success) {
			return {
				success: false,
				message:
					"入力に無効な文字列が含まれている、あるいは、文字数を超過しています。",
			};
		}
		//TODO: submit form

		return { success: true, message: "正常に登録できました。" };
	} catch (error) {
		console.error("error: ", error);
		return {
			success: false,
			message: "予期せぬエラーが発生しました。",
		};
	}
}
