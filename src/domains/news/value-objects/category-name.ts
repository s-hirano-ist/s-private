import { z } from "zod";

const categoryNameSchema = z
	.string({ message: "required" })
	.trim()
	.min(1, { message: "required" })
	.max(16, { message: "tooLong" });

export class CategoryName {
	private constructor(private readonly value: string) {}

	static create(value: string): CategoryName {
		const result = categoryNameSchema.safeParse(value);
		if (!result.success) {
			throw new Error(
				`Invalid category name: ${result.error.issues[0]?.message}`,
			);
		}
		return new CategoryName(result.data);
	}

	toString(): string {
		return this.value;
	}

	equals(other: CategoryName): boolean {
		return this.value === other.value;
	}

	// ビジネスロジック
	isEmpty(): boolean {
		return this.value.trim().length === 0;
	}

	getLength(): number {
		return this.value.length;
	}

	isMaxLength(): boolean {
		return this.value.length === 16;
	}

	capitalize(): string {
		return (
			this.value.charAt(0).toUpperCase() + this.value.slice(1).toLowerCase()
		);
	}
}
