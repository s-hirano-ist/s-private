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

const ISBN = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(17, { message: "tooLong" })
	.regex(/^[\d-]+$/, { message: "invalidFormat" })
	.brand<"ISBN">();
export type ISBN = z.infer<typeof ISBN>;
export const makeISBN = (v: string): ISBN => ISBN.parse(v);

const BookTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(256, { message: "tooLong" })
	.brand<"BookTitle">();
export type BookTitle = z.infer<typeof BookTitle>;
export const makeBookTitle = (v: string): BookTitle => BookTitle.parse(v);

const GoogleTitle = z.string().nullable().brand<"GoogleTitle">();
export type GoogleTitle = z.infer<typeof GoogleTitle>;
export const makeGoogleTitle = (v: string | null | undefined): GoogleTitle =>
	GoogleTitle.parse(v);

const GoogleSubtitle = z.string().nullable().brand<"GoogleSubTitle">();
export type GoogleSubtitle = z.infer<typeof GoogleSubtitle>;
export const makeGoogleSubTitle = (
	v: string | null | undefined,
): GoogleSubtitle => GoogleSubtitle.parse(v);

const GoogleAuthors = z.array(z.string()).nullable().brand<"GoogleAuthors">();
export type GoogleAuthors = z.infer<typeof GoogleAuthors>;
export const makeGoogleAuthors = (
	v: string[] | null | undefined,
): GoogleAuthors => GoogleAuthors.parse(v);

const GoogleDescription = z.string().nullable().brand<"GoogleDescription">();
export type GoogleDescription = z.infer<typeof GoogleDescription>;
export const makeGoogleDescription = (
	v: string | null | undefined,
): GoogleDescription => GoogleDescription.parse(v);

const GoogleImgSrc = z.string().nullable().brand<"GoogleImgSrc">();
export type GoogleImgSrc = z.infer<typeof GoogleImgSrc>;
export const makeGoogleImgSrc = (v: string | null | undefined): GoogleImgSrc =>
	GoogleImgSrc.parse(v);

const GoogleHref = z.string().nullable().brand<"GoogleHref">();
export type GoogleHref = z.infer<typeof GoogleHref>;
export const makeGoogleHref = (v: string | null | undefined): GoogleHref =>
	GoogleHref.parse(v);

const BookMarkdown = z.string().nullable().brand<"BookMarkdown">();
export type BookMarkdown = z.infer<typeof BookMarkdown>;
export const makeBookMarkdown = (v: string | null): BookMarkdown =>
	BookMarkdown.parse(v);

// Entities

const Base = z.object({
	id: Id,
	userId: UserId,
	ISBN: ISBN,
	title: BookTitle,
	googleTitle: GoogleTitle.optional(),
	googleSubtitle: GoogleSubtitle.optional(),
	googleAuthors: GoogleAuthors.optional(),
	googleDescription: GoogleDescription.optional(),
	googleImgSrc: GoogleImgSrc.optional(),
	googleHref: GoogleHref.optional(),
	markdown: BookMarkdown.optional(),
	createdAt: CreatedAt,
});

export const UnexportedBook = Base.extend({ status: UnexportedStatus });
export type UnexportedBook = Readonly<z.infer<typeof UnexportedBook>>;

const ExportedBook = Base.extend(ExportedStatus.shape);
type ExportedBook = Readonly<z.infer<typeof ExportedBook>>;

type CreateBookArgs = Readonly<{
	userId: UserId;
	ISBN: ISBN;
	title: BookTitle;
}>;

export const bookEntity = {
	create: (args: CreateBookArgs): UnexportedBook => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...args,
			}),
		);
	},

	export: (book: UnexportedBook): ExportedBook => {
		return createEntityWithErrorHandling(() => {
			const exportedStatus = makeExportedStatus();
			return Object.freeze({
				...book,
				...exportedStatus,
			});
		});
	},
};
