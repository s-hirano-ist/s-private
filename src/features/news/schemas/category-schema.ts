import { FORM_ERROR_MESSAGES } from "@/constants";
import { z } from "zod";

export const categorySchema = z.object({
	name: z
		.string({ message: FORM_ERROR_MESSAGES.REQUIRED })
		.trim()
		.min(1, { message: FORM_ERROR_MESSAGES.REQUIRED })
		.max(16, { message: FORM_ERROR_MESSAGES.TOO_LONG }),
});
