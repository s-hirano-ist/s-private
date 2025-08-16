import { z } from "zod";

const isbnSchema = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(17, { message: "tooLong" })
	.regex(/^[\d-]+$/, { message: "invalidFormat" });

export class ISBN {
	private constructor(private readonly value: string) {}

	static create(value: string): ISBN {
		const result = isbnSchema.safeParse(value);
		if (!result.success) {
			throw new Error(
				`Invalid ISBN format: ${result.error.issues[0]?.message}`,
			);
		}
		return new ISBN(result.data);
	}

	toString(): string {
		return this.value;
	}

	equals(other: ISBN): boolean {
		return this.value === other.value;
	}

	// ビジネスロジック
	isISBN10(): boolean {
		const cleanISBN = this.value.replace(/-/g, "");
		return cleanISBN.length === 10;
	}

	isISBN13(): boolean {
		const cleanISBN = this.value.replace(/-/g, "");
		return cleanISBN.length === 13;
	}

	getCleanFormat(): string {
		return this.value.replace(/-/g, "");
	}
}
