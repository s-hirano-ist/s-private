import { z } from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";

// value objects

export const contentsInputSchema = z
	.object({
		title: z
			.string({ message: "required" })
			.min(1, { message: "required" })
			.max(64, { message: "tooLong" }),
		markdown: z.string({ message: "required" }).min(1, { message: "required" }),
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
	})
	.strict();

// entities

export const contentsFormSchema = contentsInputSchema;
export type ContentsFormSchema = z.infer<typeof contentsFormSchema>;

export const contentsQueryData = contentsFormSchema.omit({
	userId: true,
	status: true,
	markdown: true,
});
export type ContentsQueryData = z.infer<typeof contentsQueryData>;

export const singleContentsQueryData = contentsFormSchema.omit({
	userId: true,
	status: true,
});
export type SingleContentsQueryData = z.infer<typeof singleContentsQueryData>;
