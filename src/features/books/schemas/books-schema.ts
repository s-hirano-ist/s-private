import { z } from "zod";

export const booksSchema = z.object({
	ISBN: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.max(17, { message: "tooLong" })
		.regex(/^[\d-]+$/, { message: "invalidFormat" }),
	title: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.max(256, { message: "tooLong" }),
});
