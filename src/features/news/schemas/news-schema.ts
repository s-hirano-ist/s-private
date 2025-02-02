import { isValidUrl } from "@/utils/validate-url";
import { z } from "zod";

export const newsSchema = z.object({
	categoryId: z.number(),
	title: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.max(64, { message: "tooLong" }),
	quote: z
		.string({ message: "required" })
		.max(256, { message: "tooLong" })
		.nullable(),
	url: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.url({ message: "invalidFormat" })
		.refine((url) => isValidUrl(url), { message: "invalidFormat" }),
});
