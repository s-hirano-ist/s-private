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

const CategoryName = z
	.string({ message: "required" })
	.trim()
	.min(1, { message: "required" })
	.max(16, { message: "tooLong" })
	.brand<"CategoryName">();
type CategoryName = z.infer<typeof CategoryName>;
export const makeCategoryName = (v: string): CategoryName =>
	CategoryName.parse(v);

const NewsTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(64, { message: "tooLong" })
	.brand<"NewsTitle">();
type NewsTitle = z.infer<typeof NewsTitle>;
export const makeNewsTitle = (v: string): NewsTitle => NewsTitle.parse(v);

const Quote = z
	.string()
	.max(256, { message: "tooLong" })
	.nullable()
	.optional()
	.brand<"Quote">();
type Quote = z.infer<typeof Quote>;
export const makeQuote = (v: string | null | undefined): Quote =>
	Quote.parse(v);

const Url = z
	.url({ message: "invalidFormat" })
	.min(1, { message: "required" })
	.refine(
		(url: string) => {
			try {
				const urlObject = new URL(url);
				return (
					urlObject.protocol === "http:" || urlObject.protocol === "https:"
				);
			} catch {
				return false;
			}
		},
		{ message: "invalidFormat" },
	)
	.brand<"Url">();
export type Url = z.infer<typeof Url>;
export const makeUrl = (v: string): Url => Url.parse(v);

const OgTitle = z.string().nullable().optional().brand<"OgTitle">();
type OgTitle = z.infer<typeof OgTitle>;
export const makeOgTitle = (v: string | null | undefined): OgTitle =>
	OgTitle.parse(v);

const OgDescription = z.string().nullable().optional().brand<"OgDescription">();
type OgDescription = z.infer<typeof OgDescription>;
export const makeOgDescription = (
	v: string | null | undefined,
): OgDescription => OgDescription.parse(v);

// Entities

export const news = z.object({
	id: Id,
	userId: UserId,
	categoryName: CategoryName,
	categoryId: Id,
	title: NewsTitle,
	quote: Quote,
	url: Url,
	status: Status,
	ogTitle: OgTitle,
	ogDescription: OgDescription,
});
export type News = Readonly<z.infer<typeof news>>;

type CreateNewsArgs = Readonly<{
	userId: UserId;
	categoryName: CategoryName;
	title: NewsTitle;
	quote?: Quote;
	url: Url;
}>;

export const newsEntity = {
	create: (args: CreateNewsArgs): News => {
		try {
			return Object.freeze({
				id: makeId(),
				status: makeStatus("UNEXPORTED"),
				categoryId: makeId(),
				...args,
			});
		} catch (error) {
			if (error instanceof ZodError) throw new InvalidFormatError();
			throw new UnexpectedError();
		}
	},
};
