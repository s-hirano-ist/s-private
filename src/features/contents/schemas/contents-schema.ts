import { FORM_ERROR_MESSAGES } from "@/constants";
import { z } from "zod";

export const contentsSchema = z.object({
	title: z
		.string()
		.min(1, { message: FORM_ERROR_MESSAGES.REQUIRED })
		.max(64, { message: FORM_ERROR_MESSAGES.TOO_LONG }),
	quote: z
		.string()
		.max(256, { message: FORM_ERROR_MESSAGES.TOO_LONG })
		.nullable(),
	url: z.string().url().min(1, { message: FORM_ERROR_MESSAGES.REQUIRED }),
});
