import { z } from "zod";
import { Id, Status, UserId } from "@/domains/common/entities/common-entity";

// value objects

export const booksInputSchema = z
	.object({
		ISBN: z
			.string({ message: "required" })
			.min(1, { message: "required" })
			.max(17, { message: "tooLong" })
			.regex(/^[\d-]+$/, { message: "invalidFormat" }),
		title: z
			.string({ message: "required" })
			.min(1, { message: "required" })
			.max(256, { message: "tooLong" }),
		userId: UserId,
		id: Id,
		status: Status,
	})
	.strict();

export const booksAdditionalSchema = z
	.object({
		googleTitle: z.string().nullable().optional(),
		googleSubTitle: z.string().nullable().optional(),
		googleAuthors: z.array(z.string()).nullable().optional(),
		googleDescription: z.string().nullable().optional(),
		googleImgSrc: z.string().nullable().optional(),
		googleHref: z.string().nullable().optional(),
		markdown: z.string().nullable().optional(),
	})
	.strict();

// entities

export const booksFormSchema = booksInputSchema;
export type BooksFormSchema = z.infer<typeof booksFormSchema>;

export const booksQueryData = booksInputSchema
	.merge(booksAdditionalSchema)
	.omit({ userId: true, status: true });
export type BooksQueryData = z.infer<typeof booksQueryData>;
