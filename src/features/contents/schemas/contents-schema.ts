import { z } from "zod";
import { isValidUrl } from "@/utils/validate-url";

export const contentsSchema = z.object({
	title: z
		.string()
		.min(1, { message: "required" })
		.max(64, { message: "tooLong" }),
	quote: z.string().max(256, { message: "tooLong" }).nullable(),
	url: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.url({ message: "invalidFormat" })
		.refine((url) => isValidUrl(url), { message: "invalidFormat" }),
});
