import { z } from "zod";
import {
	CreatedAt,
	ExportedAt,
	Id,
	makeCreatedAt,
	makeId,
	makeStatus,
	Status,
	UserId,
} from "@/domains/common/entities/common-entity";
import { createEntityWithErrorHandling } from "@/domains/common/services/entity-factory";

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

const note = z.object({
	id: Id,
	userId: UserId,
	title: NoteTitle,
	markdown: Markdown,
	status: Status,
	createdAt: CreatedAt,
	exportedAt: ExportedAt,
});
export type Note = Readonly<z.infer<typeof note>>;

type CreateNoteArgs = Readonly<{
	userId: UserId;
	title: NoteTitle;
	markdown: Markdown;
}>;

export const noteEntity = {
	create: (args: CreateNoteArgs): Note => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: makeStatus("UNEXPORTED"),
				createdAt: makeCreatedAt(),
				...args,
			}),
		);
	},
};
