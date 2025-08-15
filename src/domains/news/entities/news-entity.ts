import { z } from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";

const isValidUrl = (url: string) => {
	try {
		const urlObject = new URL(url);
		return urlObject.protocol === "http:" || urlObject.protocol === "https:";
	} catch {
		return false;
	}
};

// value objects

export const categoryInputSchema = z
	.object({
		name: z
			.string({ message: "required" })
			.trim()
			.min(1, { message: "required" })
			.max(16, { message: "tooLong" }),
		userId: userIdSchema,
		id: idSchema,
	})
	.strict();

export const newsInputSchema = z
	.object({
		category: categoryInputSchema,
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
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
	})
	.strict();

export const newsAdditionalSchema = z
	.object({
		ogTitle: z.string().nullable().optional(),
		ogDescription: z.string().nullable().optional(),
	})
	.strict();

// entities

export const newsFormSchema = newsInputSchema;
export type NewsFormSchema = z.infer<typeof newsFormSchema>;

export const categoryQueryData = categoryInputSchema.omit({ userId: true });
export type CategoryQueryData = z.infer<typeof categoryQueryData>;

export const newsQueryData = newsInputSchema
	.merge(newsAdditionalSchema)
	.omit({ userId: true, status: true })
	.extend({
		category: categoryInputSchema.omit({ userId: true }),
	});
export type NewsQueryData = z.infer<typeof newsQueryData>;
