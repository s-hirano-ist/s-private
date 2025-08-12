import { describe, expect, test } from "vitest";
import type { Status } from "@/types";
import {
	formatCreateContentsMessage,
	formatCreateImageMessage,
	formatCreateNewsMessage,
	formatDeleteMessage,
} from "./format-for-notification";

describe("formatDeleteMessage", () => {
	test("should format the delete message correctly", () => {
		const id = 1;
		const contentName = "NEWS";

		const result = formatDeleteMessage(id, contentName);

		expect(result).toBe("【NEWS】\n\n更新\nID: 1");
	});
});

describe("formatCreateNewsMessage", () => {
	test("should format the create news message correctly", () => {
		const title = "新しいニュース";
		const quote = "これは引用です";
		const url = "https://example.com";
		const Category = {
			id: 1,
			name: "カテゴリー",
			userId: "xxx",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = formatCreateNewsMessage({ title, quote, url, Category });

		expect(result).toBe(
			"【NEWS】\n\nコンテンツ\ntitle: 新しいニュース \nquote: これは引用です \nurl: https://example.com\ncategory: カテゴリー\nの登録ができました",
		);
	});

	test("should format the create contents message correctly", () => {
		const title = "新しいニュース";
		const quote = "これは引用です";
		const url = "https://example.com";

		const result = formatCreateContentsMessage({ title, markdown: quote });

		expect(result).toBe(
			"【CONTENTS】\n\nコンテンツ\ntitle: 新しいニュース \nquote: これは引用です\nの登録ができました",
		);
	});
});

describe("formatCreateImageMessage", () => {
	test("should format the create image message correctly", () => {
		const fileName = "xx.jpg";

		const result = formatCreateImageMessage({ fileName });

		expect(result).toBe(
			"【IMAGE】\n\nコンテンツ\nfileName: xx.jpg\nの登録ができました",
		);
	});
});
