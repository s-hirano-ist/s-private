import { z } from "zod";

export const categorySchema = z.object({
	name: z
		.string({ message: "required" })
		.trim()
		.min(1, { message: "required" })
		.max(16, { message: "tooLong" }),
});
