import { z } from "zod";

const quoteSchema = z
	.string()
	.max(256, { message: "tooLong" })
	.nullable()
	.optional();

export class NewsQuote {
	private constructor(private readonly value: string | null) {}

	static create(value: string | null | undefined): NewsQuote {
		const result = quoteSchema.safeParse(value);
		if (!result.success) {
			throw new Error(`Invalid quote: ${result.error.issues[0]?.message}`);
		}
		return new NewsQuote(result.data ?? null);
	}

	toString(): string | null {
		return this.value;
	}

	equals(other: NewsQuote): boolean {
		return this.value === other.value;
	}

	// ビジネスロジック
	isEmpty(): boolean {
		return this.value === null || this.value.trim().length === 0;
	}

	hasQuote(): boolean {
		return !this.isEmpty();
	}

	getLength(): number {
		return this.value?.length ?? 0;
	}

	truncate(maxLength: number): string | null {
		if (!this.value) return null;
		if (this.value.length <= maxLength) {
			return this.value;
		}
		return this.value.substring(0, maxLength - 3) + "...";
	}

	getPreview(length = 50): string | null {
		return this.truncate(length);
	}
}
