import { z } from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";
import { NewsQuote } from "../value-objects/news-quote";
import { NewsTitle } from "../value-objects/news-title";
import { NewsUrl } from "../value-objects/news-url";
import {
	CategoryEntity,
	type CategoryProps,
	categoryPropsSchema,
} from "./category.entity";

// Zodスキーマ（バリデーション用）
export const newsPropsSchema = z
	.object({
		id: idSchema,
		title: z.string(),
		url: z.string(),
		quote: z.string().nullable().optional(),
		userId: userIdSchema,
		status: statusSchema,
		category: categoryPropsSchema,
		ogTitle: z.string().nullable().optional(),
		ogDescription: z.string().nullable().optional(),
	})
	.strict();

export type NewsProps = z.infer<typeof newsPropsSchema>;

// Form schema for legacy compatibility
export const newsFormSchema = z
	.object({
		category: categoryPropsSchema,
		title: z.string(),
		quote: z.string().nullable().optional(),
		url: z.string(),
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
	})
	.strict();
export type NewsFormSchema = z.infer<typeof newsFormSchema>;

// Query data schema for legacy compatibility
export const newsQueryDataSchema = newsPropsSchema
	.omit({ userId: true, status: true })
	.extend({
		category: categoryPropsSchema.omit({ userId: true }),
	});
export type NewsQueryData = z.infer<typeof newsQueryDataSchema>;

export class NewsEntity {
	private props: NewsProps;
	private title: NewsTitle;
	private url: NewsUrl;
	private quote: NewsQuote;
	private category: CategoryEntity;

	private constructor(props: NewsProps) {
		// Zodでバリデーション
		this.props = newsPropsSchema.parse(props);
		this.title = NewsTitle.create(props.title);
		this.url = NewsUrl.create(props.url);
		this.quote = NewsQuote.create(props.quote);
		this.category = CategoryEntity.reconstitute(props.category);
	}

	static create(props: NewsProps): NewsEntity {
		return new NewsEntity(props);
	}

	static reconstitute(props: NewsProps): NewsEntity {
		// DBから復元する際もバリデーションを実行
		return new NewsEntity(props);
	}

	// ビジネスロジック
	canBeExported(): boolean {
		return this.props.status === "UNEXPORTED";
	}

	canBeDeleted(): boolean {
		return this.props.status === "UNEXPORTED";
	}

	markAsExported(): void {
		if (!this.canBeExported()) {
			throw new Error("News cannot be exported - already exported");
		}
		this.props.status = "EXPORTED";
	}

	updateCategory(newCategory: CategoryEntity): void {
		if (!newCategory.belongsToUser(this.props.userId)) {
			throw new Error("Category does not belong to the same user");
		}
		this.category = newCategory;
		this.props.category = newCategory.toRepository();
	}

	updateOgInfo(ogInfo: { title?: string; description?: string }): void {
		if (ogInfo.title !== undefined) this.props.ogTitle = ogInfo.title;
		if (ogInfo.description !== undefined)
			this.props.ogDescription = ogInfo.description;
	}

	updateQuote(newQuote: string | null): void {
		this.quote = NewsQuote.create(newQuote);
		this.props.quote = this.quote.toString();
	}

	belongsToUser(userId: string): boolean {
		return this.props.userId === userId;
	}

	hasOgInfo(): boolean {
		return !!(this.props.ogTitle || this.props.ogDescription);
	}

	getDomainFromUrl(): string {
		return this.url.getDomain();
	}

	isSecureUrl(): boolean {
		return this.url.isHttps();
	}

	// ゲッター
	getId(): string {
		return this.props.id;
	}

	getTitle(): NewsTitle {
		return this.title;
	}

	getUrl(): NewsUrl {
		return this.url;
	}

	getQuote(): NewsQuote {
		return this.quote;
	}

	getCategory(): CategoryEntity {
		return this.category;
	}

	getUserId(): string {
		return this.props.userId;
	}

	getStatus(): "UNEXPORTED" | "EXPORTED" {
		return this.props.status;
	}

	getOgTitle(): string | null | undefined {
		return this.props.ogTitle;
	}

	getOgDescription(): string | null | undefined {
		return this.props.ogDescription;
	}

	// データベース保存用
	toRepository(): NewsProps {
		return {
			...this.props,
			title: this.title.toString(),
			url: this.url.toString(),
			quote: this.quote.toString(),
			category: this.category.toRepository(),
		};
	}

	// 表示用データ（userIdとstatusを除外）
	toQueryData(): NewsQueryData {
		const { userId, status, ...queryData } = this.toRepository();
		return {
			...queryData,
			category: this.category.toQueryData(),
		};
	}

	// Form用データ変換
	toFormData(): NewsFormSchema {
		return {
			id: this.props.id,
			title: this.title.toString(),
			url: this.url.toString(),
			quote: this.quote.toString(),
			category: this.category.toRepository(),
			userId: this.props.userId,
			status: this.props.status,
		};
	}

	// 静的ファクトリメソッド（Formデータから）
	static fromFormData(formData: NewsFormSchema): NewsEntity {
		return NewsEntity.create({
			...formData,
			ogTitle: null,
			ogDescription: null,
		});
	}

	// 静的ファクトリメソッド（Queryデータから）
	static fromQueryData(
		queryData: NewsQueryData,
		userId: string,
		status: "UNEXPORTED" | "EXPORTED"
	): NewsEntity {
		return NewsEntity.reconstitute({
			...queryData,
			userId,
			status,
			category: {
				...queryData.category,
				userId, // Add userId back for category
			},
		});
	}
}
