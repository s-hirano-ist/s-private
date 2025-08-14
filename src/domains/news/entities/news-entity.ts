import { z } from "zod";

const isValidUrl = (url: string) => {
	try {
		const urlObject = new URL(url);
		return urlObject.protocol === "http:" || urlObject.protocol === "https:";
	} catch {
		return false;
	}
};

export const categoryNameSchema = z
	.string({ message: "required" })
	.trim()
	.min(1, { message: "required" })
	.max(16, { message: "tooLong" });

export type CategoryQueryData = z.infer<typeof categoryNameSchema>;

export const newsFormSchema = z.object({
	categoryName: categoryNameSchema,
	title: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.max(64, { message: "tooLong" }),
	quote: z.string().max(256, { message: "tooLong" }).nullable().optional(),
	url: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.url({ message: "invalidFormat" })
		.refine((url) => isValidUrl(url), { message: "invalidFormat" }),
	userId: z.string({ message: "required" }),
	id: z.string(),
});

export const newsEntity = newsFormSchema.extend({
	ogTitle: z.string().nullable().optional(),
	ogDescription: z.string().nullable().optional(),
});
export type NewsEntity = z.infer<typeof newsEntity>;

export type NewsFormSchema = z.infer<typeof newsFormSchema>;

export const newsQueryData = newsEntity.omit({ userId: true });
export type NewsQueryData = z.infer<typeof newsQueryData>;
