import { z } from "zod";
import {
	CreatedAt,
	ExportedStatus,
	Id,
	makeCreatedAt,
	makeExportedStatus,
	makeId,
	UnexportedStatus,
	UserId,
} from "../../common/entities/common-entity";
import { createEntityWithErrorHandling } from "../../common/services/entity-factory";

// Value objects

/** ノートタイトルのZodスキーマ (1-64文字) */
export const NoteTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(64, { message: "tooLong" })
	.brand<"NoteTitle">();
export type NoteTitle = z.infer<typeof NoteTitle>;
export const makeNoteTitle = (v: string): NoteTitle => NoteTitle.parse(v);

/** マークダウンのZodスキーマ */
export const Markdown = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.brand<"Markdown">();
export type Markdown = z.infer<typeof Markdown>;
export const makeMarkdown = (v: string): Markdown => Markdown.parse(v);

// Entities

const Base = z.object({
	id: Id,
	userId: UserId,
	title: NoteTitle,
	markdown: Markdown,
	createdAt: CreatedAt,
});

export const UnexportedNote = Base.extend({ status: UnexportedStatus });
export type UnexportedNote = Readonly<z.infer<typeof UnexportedNote>>;

/** エクスポート済みノートのZodスキーマ */
export const ExportedNote = Base.extend(ExportedStatus.shape);
/** エクスポート済みノートの型 */
export type ExportedNote = Readonly<z.infer<typeof ExportedNote>>;

/** ノート作成時の引数 */
export type CreateNoteArgs = Readonly<{
	userId: UserId;
	title: NoteTitle;
	markdown: Markdown;
}>;

export const noteEntity = {
	create: (args: CreateNoteArgs): UnexportedNote => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...args,
			}),
		);
	},

	export: (note: UnexportedNote): ExportedNote => {
		return createEntityWithErrorHandling(() => {
			const exportedStatus = makeExportedStatus();
			return Object.freeze({
				...note,
				...exportedStatus,
			});
		});
	},
};
