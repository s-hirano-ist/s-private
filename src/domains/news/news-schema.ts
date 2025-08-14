import { z } from "zod";
import { isValidUrl } from "@/utils/validate-url";

export const newsEntity = z.object({
	id: z.string(),
	categoryName: z
		.string({ message: "required" })
		.trim()
		.min(1, { message: "required" })
		.max(16, { message: "tooLong" }),
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
	ogTitle: z.string().nullable(),
	ogDescription: z.string().nullable(),
	userId: z.string({ message: "required" }),
});
export type NewsEntity = z.infer<typeof newsEntity>;

export const newsFormSchema = newsEntity.pick({
	title: true,
	quote: true,
	url: true,
	categoryName: true,
	userId: true,
});
export type NewsFormSchema = z.infer<typeof newsFormSchema>;

export const newsQuerySchema = newsEntity.omit({
	userId: true,
});
export type NewsQuerySchema = z.infer<typeof newsQuerySchema>;

export const categoryQuerySchema = newsEntity.pick({
	categoryName: true,
	categoryId: true,
});
export type CategoryQuerySchema = z.infer<typeof categoryQuerySchema>;
