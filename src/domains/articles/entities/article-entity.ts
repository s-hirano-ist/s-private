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
} from "@/domains/common/entities/common-entity";
import { createEntityWithErrorHandling } from "@/domains/common/services/entity-factory";

// Value objects

const CategoryName = z
	.string({ message: "required" })
	.trim()
	.min(1, { message: "required" })
	.max(16, { message: "tooLong" })
	.brand<"CategoryName">();
export type CategoryName = z.infer<typeof CategoryName>;
export const makeCategoryName = (v: string): CategoryName =>
	CategoryName.parse(v);

const ArticleTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(64, { message: "tooLong" })
	.brand<"ArticleTitle">();
export type ArticleTitle = z.infer<typeof ArticleTitle>;
export const makeArticleTitle = (v: string): ArticleTitle =>
	ArticleTitle.parse(v);

const Quote = z
	.string()
	.max(256, { message: "tooLong" })
	.nullable()
	.optional()
	.brand<"Quote">();
export type Quote = z.infer<typeof Quote>;
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
export type OgTitle = z.infer<typeof OgTitle>;
export const makeOgTitle = (v: string | null | undefined): OgTitle =>
	OgTitle.parse(v);

const OgDescription = z.string().nullable().optional().brand<"OgDescription">();
export type OgDescription = z.infer<typeof OgDescription>;
export const makeOgDescription = (
	v: string | null | undefined,
): OgDescription => OgDescription.parse(v);

const OgImageUrl = z.string().nullable().optional().brand<"OgImageUrl">();
export type OgImageUrl = z.infer<typeof OgImageUrl>;
export const makeOgImageUrl = (v: string | null | undefined): OgImageUrl =>
	OgImageUrl.parse(v);

// Entities

const Base = z.object({
	id: Id,
	userId: UserId,
	categoryName: CategoryName,
	categoryId: Id,
	title: ArticleTitle,
	quote: Quote,
	url: Url,
	createdAt: CreatedAt,
	ogTitle: OgTitle,
	ogDescription: OgDescription,
	ogImageUrl: OgImageUrl,
});

export const UnexportedArticle = Base.extend({ status: UnexportedStatus });
export type UnexportedArticle = Readonly<z.infer<typeof UnexportedArticle>>;

const ExportedArticle = Base.extend(ExportedStatus.shape);
type ExportedArticle = Readonly<z.infer<typeof ExportedArticle>>;

type CreateArticleArgs = Readonly<{
	userId: UserId;
	categoryName: CategoryName;
	title: ArticleTitle;
	quote?: Quote;
	url: Url;
}>;

type UpdateArticleArgs = Readonly<{
	title: ArticleTitle;
	quote: Quote;
	ogTitle: OgTitle;
	ogDescription: OgDescription;
	ogImageUrl: OgImageUrl;
}>;

export const articleEntity = {
	create: (args: CreateArticleArgs): UnexportedArticle => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				categoryId: makeId(),
				createdAt: makeCreatedAt(),
				...args,
			}),
		);
	},
	update: (
		article: UnexportedArticle,
		args: UpdateArticleArgs,
	): UnexportedArticle => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({ ...article, ...args }),
		);
	},
	export: (article: UnexportedArticle): ExportedArticle => {
		return createEntityWithErrorHandling(() => {
			const exportedStatus = makeExportedStatus();
			return Object.freeze({
				...article,
				...exportedStatus,
			});
		});
	},
};
