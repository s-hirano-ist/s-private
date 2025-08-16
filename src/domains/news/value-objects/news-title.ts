import { z } from "zod";

const titleSchema = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.max(64, { message: "tooLong" });

export class NewsTitle {
	private constructor(private readonly value: string) {}

	static create(value: string): NewsTitle {
		const result = titleSchema.safeParse(value);
		if (!result.success) {
			throw new Error(`Invalid news title: ${result.error.issues[0]?.message}`);
		}
		return new NewsTitle(result.data);
	}

	toString(): string {
		return this.value;
	}

	equals(other: NewsTitle): boolean {
		return this.value === other.value;
	}

	// ビジネスロジック
	isEmpty(): boolean {
		return this.value.trim().length === 0;
	}

	getLength(): number {
		return this.value.length;
	}

	truncate(maxLength: number): string {
		if (this.value.length <= maxLength) {
			return this.value;
		}
		return this.value.substring(0, maxLength - 3) + "...";
	}

	getPreview(length = 30): string {
		return this.truncate(length);
	}
}
