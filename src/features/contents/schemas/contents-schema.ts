import { FORM_ERROR_MESSAGES } from "@/constants";
import { validateUrl } from "@/utils/validate-url";
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
	url: z
		.string({ message: FORM_ERROR_MESSAGES.REQUIRED })
		.min(1, { message: FORM_ERROR_MESSAGES.REQUIRED })
		.url({ message: FORM_ERROR_MESSAGES.INVALID_FORMAT })
		.refine((url) => validateUrl(url), {
			message: FORM_ERROR_MESSAGES.INVALID_FORMAT,
		}),
});
