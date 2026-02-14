import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, test, vi } from "vitest";
import { ArticleForm } from "./article-form";

const messages = {
	label: {
		save: "保存",
		title: "タイトル",
		url: "URL",
		description: "ひとこと",
		category: "カテゴリー",
		noResults: "見つかりませんでした",
		searchPlaceholder: "検索...",
		useCustomValue: "「{value}」を使用",
	},
	message: { inserted: "正常に登録されました。" },
};

describe("ArticleForm", () => {
	test("pastes clipboard content into the URL field", async () => {
		const clipboardText = "https://example.com";
		Object.assign(navigator, {
			clipboard: { readText: vi.fn().mockResolvedValue(clipboardText) },
		});

		render(
			<NextIntlClientProvider locale="ja" messages={messages}>
				<ArticleForm addArticle={vi.fn()} categories={[]} />
			</NextIntlClientProvider>,
		);
		const pasteButton = screen.getByTestId("paste-button");

		fireEvent.click(pasteButton);

		await waitFor(() => {
			expect(screen.getByRole("textbox", { name: "URL" })).toHaveValue(
				clipboardText,
			);
		});
	});
});
