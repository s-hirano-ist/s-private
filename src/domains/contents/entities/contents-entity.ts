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

// Value objects

const ContentTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(64, { message: "tooLong" })
	.brand<"ContentTitle">();
export type ContentTitle = z.infer<typeof ContentTitle>;
export const makeContentTitle = (v: string): ContentTitle =>
	ContentTitle.parse(v);

const Markdown = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.brand<"Markdown">();
type Markdown = z.infer<typeof Markdown>;
export const makeMarkdown = (v: string): Markdown => Markdown.parse(v);

// Entities

export const content = z.object({
	id: Id,
	userId: UserId,
	title: ContentTitle,
	markdown: Markdown,
	status: Status,
});
export type Content = Readonly<z.infer<typeof content>>;

type CreateContentArgs = Readonly<{
	userId: UserId;
	title: ContentTitle;
	markdown: Markdown;
}>;

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
