import { z } from "zod";

export const contentsSchema = z.object({
	title: z
		.string()
		.min(1, { message: "required" })
		.max(64, { message: "tooLong" }),
	markdown: z.string().min(1, { message: "required" }),
});
