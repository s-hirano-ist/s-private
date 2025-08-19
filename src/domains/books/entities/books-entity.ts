import { ZodError, z } from "zod";
import {
	InvalidFormatError,
	UnexpectedError,
} from "@/common/error/error-classes";
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
type GoogleTitle = z.infer<typeof GoogleTitle>;
export const makeGoogleTitle = (v: string | null): GoogleTitle =>
	GoogleTitle.parse(v);

const GoogleSubTitle = z.string().nullable().brand<"GoogleSubTitle">();
type GoogleSubTitle = z.infer<typeof GoogleSubTitle>;
export const makeGoogleSubTitle = (v: string | null): GoogleSubTitle =>
	GoogleSubTitle.parse(v);

const GoogleAuthors = z.array(z.string()).nullable().brand<"GoogleAuthors">();
type GoogleAuthors = z.infer<typeof GoogleAuthors>;
export const makeGoogleAuthors = (v: string[] | null): GoogleAuthors =>
	GoogleAuthors.parse(v);

const GoogleDescription = z.string().nullable().brand<"GoogleDescription">();
type GoogleDescription = z.infer<typeof GoogleDescription>;
export const makeGoogleDescription = (v: string | null): GoogleDescription =>
	GoogleDescription.parse(v);

const GoogleImgSrc = z.string().nullable().brand<"GoogleImgSrc">();
type GoogleImgSrc = z.infer<typeof GoogleImgSrc>;
export const makeGoogleImgSrc = (v: string | null): GoogleImgSrc =>
	GoogleImgSrc.parse(v);

const GoogleHref = z.string().nullable().brand<"GoogleHref">();
type GoogleHref = z.infer<typeof GoogleHref>;
export const makeGoogleHref = (v: string | null): GoogleHref =>
	GoogleHref.parse(v);

const BookMarkdown = z.string().nullable().brand<"BookMarkdown">();
type BookMarkdown = z.infer<typeof BookMarkdown>;
export const makeBookMarkdown = (v: string | null): BookMarkdown =>
	BookMarkdown.parse(v);

// Entities

export const book = z.object({
	id: Id,
	userId: UserId,
	ISBN: ISBN,
	title: BookTitle,
	status: Status,
	googleTitle: GoogleTitle.optional(),
	googleSubTitle: GoogleSubTitle.optional(),
	googleAuthors: GoogleAuthors.optional(),
	googleDescription: GoogleDescription.optional(),
	googleImgSrc: GoogleImgSrc.optional(),
	googleHref: GoogleHref.optional(),
	markdown: BookMarkdown.optional(),
	createdAt: CreatedAt,
	exportedAt: ExportedAt,
});
export type Book = Readonly<z.infer<typeof book>>;

type CreateBookArgs = Readonly<{
	userId: UserId;
	ISBN: ISBN;
	title: BookTitle;
}>;

export const bookEntity = {
	create: (args: CreateBookArgs): Book => {
		try {
			return Object.freeze({
				id: makeId(),
				status: makeStatus("UNEXPORTED"),
				createdAt: makeCreatedAt(),
				...args,
			});
		} catch (error) {
			if (error instanceof ZodError) throw new InvalidFormatError();
			throw new UnexpectedError();
		}
	},
};
