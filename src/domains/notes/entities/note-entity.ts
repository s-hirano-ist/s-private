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

const NoteTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(64, { message: "tooLong" })
	.brand<"NoteTitle">();
export type NoteTitle = z.infer<typeof NoteTitle>;
export const makeNoteTitle = (v: string): NoteTitle => NoteTitle.parse(v);

const Markdown = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.brand<"Markdown">();
type Markdown = z.infer<typeof Markdown>;
export const makeMarkdown = (v: string): Markdown => Markdown.parse(v);

// Entities

export const note = z.object({
	id: Id,
	userId: UserId,
	title: NoteTitle,
	markdown: Markdown,
	status: Status,
});
export type Note = Readonly<z.infer<typeof note>>;

type CreateNoteArgs = Readonly<{
	userId: UserId;
	title: NoteTitle;
	markdown: Markdown;
}>;

export const noteEntity = {
	create: (args: CreateNoteArgs): Note => {
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
