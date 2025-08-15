import z from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";

// value objects

// NOTE: sync with s-contents/update-db.ts
export const THUMBNAIL_WIDTH = 192;
export const THUMBNAIL_HEIGHT = 192;

export const imagesInputSchema = z
	.object({
		path: z.string(),
		contentType: z.string(),
		fileSize: z.number().nullable().optional(),
		width: z.number().nullable().optional(),
		height: z.number().nullable().optional(),
		tags: z.array(z.string()).optional(),
		description: z.string().nullable().optional(),
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
	})
	.strict();

// entities

export const imagesFormSchema = imagesInputSchema;
export type ImagesFormSchema = z.infer<typeof imagesFormSchema>;

export const imagesQueryData = imagesInputSchema.omit({
	userId: true,
	contentType: true,
	status: true,
});
export type ImagesQueryData = z.infer<typeof imagesQueryData>;
