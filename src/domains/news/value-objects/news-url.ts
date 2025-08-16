import { z } from "zod";

const isValidUrl = (url: string) => {
	try {
		const urlObject = new URL(url);
		return urlObject.protocol === "http:" || urlObject.protocol === "https:";
	} catch {
		return false;
	}
};

const urlSchema = z
	.string({ message: "required" })
	.min(1, { message: "required" })
	.url({ message: "invalidFormat" })
	.refine((url) => isValidUrl(url), { message: "invalidFormat" });

export class NewsUrl {
	private constructor(private readonly value: string) {}

	static create(value: string): NewsUrl {
		const result = urlSchema.safeParse(value);
		if (!result.success) {
			throw new Error(`Invalid URL format: ${result.error.issues[0]?.message}`);
		}
		return new NewsUrl(result.data);
	}

	toString(): string {
		return this.value;
	}

	equals(other: NewsUrl): boolean {
		return this.value === other.value;
	}

	// ビジネスロジック
	getDomain(): string {
		try {
			const url = new URL(this.value);
			return url.hostname;
		} catch {
			throw new Error("Invalid URL - cannot extract domain");
		}
	}

	getPath(): string {
		try {
			const url = new URL(this.value);
			return url.pathname;
		} catch {
			throw new Error("Invalid URL - cannot extract path");
		}
	}

	isHttps(): boolean {
		try {
			const url = new URL(this.value);
			return url.protocol === "https:";
		} catch {
			return false;
		}
	}

	withoutFragment(): string {
		try {
			const url = new URL(this.value);
			url.hash = "";
			return url.toString();
		} catch {
			return this.value;
		}
	}
}
