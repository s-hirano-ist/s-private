import { ZodError, z } from "zod";
import {
	InvalidFormatError,
	UnexpectedError,
} from "@/common/error/error-classes";
import {
	Id,
	makeId,
	makeStatus,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";

// content value objects

const Title = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(64, { message: "tooLong" })
	.brand<"Title">();
export type Title = z.infer<typeof Title>;
export const makeTitle = (v: string): Title => Title.parse(v);

const Markdown = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.brand<"Markdown">();
type Markdown = z.infer<typeof Markdown>;
export const makeMarkdown = (v: string): Markdown => Markdown.parse(v);

// content entities

export const content = z.object({
	id: Id,
	userId: UserId,
	title: Title,
	markdown: Markdown,
	status: Status,
});
export type Content = Readonly<z.infer<typeof content>>;

export const contentEntity = {
	create: (args: CreateContentArgs): Content => {
		try {
			return Object.freeze({
				id: makeId(),
				status: makeStatus("UNEXPORTED"),
				...args,
			});
		} catch (error) {
			if (error instanceof ZodError) throw new InvalidFormatError();
			throw new UnexpectedError();
		}
	},
};

export type CreateContentArgs = Readonly<{
	userId: UserId;
	title: Title;
	markdown: Markdown;
}>;

// form schema for validation
export const contentsFormSchema = z.object({
	title: z
		.string({ message: "required" })
		.min(1, { message: "required" })
		.max(64, { message: "tooLong" }),
	markdown: z.string({ message: "required" }).min(1, { message: "required" }),
	userId: z.string({ message: "required" }).min(1, { message: "required" }),
	status: Status,
});
export type ContentsFormSchema = z.infer<typeof contentsFormSchema>;
