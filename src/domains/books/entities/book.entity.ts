import { z } from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";
import { BookTitle } from "../value-objects/book-title";
import { ISBN } from "../value-objects/isbn";

// Zodスキーマ（バリデーション用）
export const bookPropsSchema = z
	.object({
		id: idSchema,
		ISBN: z.string(),
		title: z.string(),
		userId: userIdSchema,
		status: statusSchema,
		googleTitle: z.string().nullable().optional(),
		googleSubTitle: z.string().nullable().optional(),
		googleAuthors: z.array(z.string()).nullable().optional(),
		googleDescription: z.string().nullable().optional(),
		googleImgSrc: z.string().nullable().optional(),
		googleHref: z.string().nullable().optional(),
		markdown: z.string().nullable().optional(),
	})
	.strict();

export type BookProps = z.infer<typeof bookPropsSchema>;

// Form schema for legacy compatibility (moved from books-entity.ts)
export const bookFormSchema = bookPropsSchema.pick({
	ISBN: true,
	title: true,
	userId: true,
	id: true,
	status: true,
});
export type BookFormSchema = z.infer<typeof bookFormSchema>;

// Query data schema for legacy compatibility
export const bookQueryDataSchema = bookPropsSchema.omit({
	userId: true,
	status: true,
});
export type BookQueryData = z.infer<typeof bookQueryDataSchema>;

export class BookEntity {
	private props: BookProps;
	private isbn: ISBN;
	private title: BookTitle;

	private constructor(props: BookProps) {
		// Zodでバリデーション
		this.props = bookPropsSchema.parse(props);
		this.isbn = ISBN.create(props.ISBN);
		this.title = BookTitle.create(props.title);
	}

	static create(props: BookProps): BookEntity {
		return new BookEntity(props);
	}

	static reconstitute(props: BookProps): BookEntity {
		// DBから復元する際もバリデーションを実行
		return new BookEntity(props);
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
			throw new Error("Book cannot be exported - already exported");
		}
		this.props.status = "EXPORTED";
	}

	updateGoogleInfo(googleInfo: {
		title?: string;
		subTitle?: string;
		authors?: string[];
		description?: string;
		imgSrc?: string;
		href?: string;
	}): void {
		if (googleInfo.title !== undefined)
			this.props.googleTitle = googleInfo.title;
		if (googleInfo.subTitle !== undefined)
			this.props.googleSubTitle = googleInfo.subTitle;
		if (googleInfo.authors !== undefined)
			this.props.googleAuthors = googleInfo.authors;
		if (googleInfo.description !== undefined)
			this.props.googleDescription = googleInfo.description;
		if (googleInfo.imgSrc !== undefined)
			this.props.googleImgSrc = googleInfo.imgSrc;
		if (googleInfo.href !== undefined) this.props.googleHref = googleInfo.href;
	}

	addMarkdown(markdown: string): void {
		this.props.markdown = markdown;
	}

	hasGoogleInfo(): boolean {
		return !!(
			this.props.googleTitle ||
			this.props.googleSubTitle ||
			this.props.googleAuthors ||
			this.props.googleDescription ||
			this.props.googleImgSrc ||
			this.props.googleHref
		);
	}

	// ゲッター
	getId(): string {
		return this.props.id;
	}

	getISBN(): ISBN {
		return this.isbn;
	}

	getTitle(): BookTitle {
		return this.title;
	}

	getUserId(): string {
		return this.props.userId;
	}

	getStatus(): "UNEXPORTED" | "EXPORTED" {
		return this.props.status;
	}

	getGoogleTitle(): string | null | undefined {
		return this.props.googleTitle;
	}

	getGoogleSubTitle(): string | null | undefined {
		return this.props.googleSubTitle;
	}

	getGoogleAuthors(): string[] | null | undefined {
		return this.props.googleAuthors;
	}

	getGoogleDescription(): string | null | undefined {
		return this.props.googleDescription;
	}

	getGoogleImgSrc(): string | null | undefined {
		return this.props.googleImgSrc;
	}

	getGoogleHref(): string | null | undefined {
		return this.props.googleHref;
	}

	getMarkdown(): string | null | undefined {
		return this.props.markdown;
	}

	// データベース保存用
	toRepository(): BookProps {
		return {
			...this.props,
			ISBN: this.isbn.toString(),
			title: this.title.toString(),
		};
	}

	// 表示用データ（userIdとstatusを除外）
	toQueryData(): BookQueryData {
		const { userId, status, ...queryData } = this.toRepository();
		return queryData;
	}

	// Form用データ変換
	toFormData(): BookFormSchema {
		return {
			id: this.props.id,
			ISBN: this.isbn.toString(),
			title: this.title.toString(),
			userId: this.props.userId,
			status: this.props.status,
		};
	}

	// 静的ファクトリメソッド（Formデータから）
	static fromFormData(formData: BookFormSchema): BookEntity {
		return BookEntity.create({
			...formData,
			googleTitle: null,
			googleSubTitle: null,
			googleAuthors: null,
			googleDescription: null,
			googleImgSrc: null,
			googleHref: null,
			markdown: null,
		});
	}

	// 静的ファクトリメソッド（Queryデータから）
	static fromQueryData(
		queryData: BookQueryData,
		userId: string,
		status: "UNEXPORTED" | "EXPORTED"
	): BookEntity {
		return BookEntity.reconstitute({
			...queryData,
			userId,
			status,
		});
	}
}
