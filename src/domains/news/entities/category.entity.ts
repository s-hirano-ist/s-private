import { z } from "zod";
import {
	idSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";
import { CategoryName } from "../value-objects/category-name";

// Zodスキーマ（バリデーション用）
export const categoryPropsSchema = z
	.object({
		id: idSchema,
		name: z.string(),
		userId: userIdSchema,
	})
	.strict();

export type CategoryProps = z.infer<typeof categoryPropsSchema>;

// Form schema for legacy compatibility
export const categoryFormSchema = categoryPropsSchema;
export type CategoryFormSchema = z.infer<typeof categoryFormSchema>;

// Query data schema for legacy compatibility
export const categoryQueryDataSchema = categoryPropsSchema.omit({
	userId: true,
});
export type CategoryQueryData = z.infer<typeof categoryQueryDataSchema>;

export class CategoryEntity {
	private props: CategoryProps;
	private name: CategoryName;

	private constructor(props: CategoryProps) {
		// Zodでバリデーション
		this.props = categoryPropsSchema.parse(props);
		this.name = CategoryName.create(props.name);
	}

	static create(props: CategoryProps): CategoryEntity {
		return new CategoryEntity(props);
	}

	static reconstitute(props: CategoryProps): CategoryEntity {
		// DBから復元する際もバリデーションを実行
		return new CategoryEntity(props);
	}

	// ビジネスロジック
	canBeRenamed(): boolean {
		// カテゴリは常にリネーム可能
		return true;
	}

	rename(newName: string): void {
		this.name = CategoryName.create(newName);
		this.props.name = this.name.toString();
	}

	belongsToUser(userId: string): boolean {
		return this.props.userId === userId;
	}

	// ゲッター
	getId(): string {
		return this.props.id;
	}

	getName(): CategoryName {
		return this.name;
	}

	getUserId(): string {
		return this.props.userId;
	}

	// データベース保存用
	toRepository(): CategoryProps {
		return {
			...this.props,
			name: this.name.toString(),
		};
	}

	// 表示用データ（userIdを除外）
	toQueryData(): CategoryQueryData {
		const { userId, ...queryData } = this.toRepository();
		return queryData;
	}

	// Form用データ変換
	toFormData(): CategoryFormSchema {
		return this.toRepository();
	}

	// 静的ファクトリメソッド（Formデータから）
	static fromFormData(formData: CategoryFormSchema): CategoryEntity {
		return CategoryEntity.create(formData);
	}

	// 静的ファクトリメソッド（Queryデータから）
	static fromQueryData(
		queryData: CategoryQueryData,
		userId: string
	): CategoryEntity {
		return CategoryEntity.reconstitute({
			...queryData,
			userId,
		});
	}
}
