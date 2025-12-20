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

/** カテゴリ名のZodスキーマ (1-16文字) */
export const CategoryName = z
	.string({ message: "required" })
	.trim()
	.min(1, { message: "required" })
	.max(16, { message: "tooLong" })
	.brand<"CategoryName">();
export type CategoryName = z.infer<typeof CategoryName>;
export const makeCategoryName = (v: string): CategoryName =>
	CategoryName.parse(v);

/** 記事タイトルのZodスキーマ (1-128文字) */
export const ArticleTitle = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(128, { message: "tooLong" })
	.brand<"ArticleTitle">();
export type ArticleTitle = z.infer<typeof ArticleTitle>;
export const makeArticleTitle = (v: string): ArticleTitle =>
	ArticleTitle.parse(v);

/** 引用のZodスキーマ (最大512文字、null/undefined許容) */
export const Quote = z
	.string()
	.max(512, { message: "tooLong" })
	.nullable()
	.optional()
	.brand<"Quote">();
export type Quote = z.infer<typeof Quote>;
export const makeQuote = (v: string | null | undefined): Quote =>
	Quote.parse(v);

/** URLのZodスキーマ (http/httpsのみ許容) */
export const Url = z
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

/** OGPタイトルのZodスキーマ (null/undefined許容) */
export const OgTitle = z.string().nullable().optional().brand<"OgTitle">();
export type OgTitle = z.infer<typeof OgTitle>;
export const makeOgTitle = (v: string | null | undefined): OgTitle =>
	OgTitle.parse(v);

/** OGP説明のZodスキーマ (null/undefined許容) */
export const OgDescription = z
	.string()
	.nullable()
	.optional()
	.brand<"OgDescription">();
export type OgDescription = z.infer<typeof OgDescription>;
export const makeOgDescription = (
	v: string | null | undefined,
): OgDescription => OgDescription.parse(v);

/** OGP画像URLのZodスキーマ (null/undefined許容) */
export const OgImageUrl = z
	.string()
	.nullable()
	.optional()
	.brand<"OgImageUrl">();
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

/** エクスポート済み記事のZodスキーマ */
export const ExportedArticle = Base.extend(ExportedStatus.shape);
/** エクスポート済み記事の型 */
export type ExportedArticle = Readonly<z.infer<typeof ExportedArticle>>;

/** 記事作成時の引数 */
export type CreateArticleArgs = Readonly<{
	userId: UserId;
	categoryName: CategoryName;
	title: ArticleTitle;
	quote?: Quote;
	url: Url;
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
