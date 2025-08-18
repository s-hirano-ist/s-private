import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, test, vi } from "vitest";
import { ArticleFormClient } from "./article-form-client";

const messages = {
	label: {
		save: "保存",
		title: "タイトル",
		url: "URL",
		description: "ひとこと",
		category: "カテゴリー",
	},
	message: { inserted: "正常に登録されました。" },
};

describe("ArticleFormClient", () => {
	test("pastes clipboard content into the URL field", async () => {
		const clipboardText = "https://example.com";
		Object.assign(navigator, {
			clipboard: { readText: vi.fn().mockResolvedValue(clipboardText) },
		});

		render(
			<NextIntlClientProvider locale="ja" messages={messages}>
				<ArticleFormClient addArticle={vi.fn()} categories={[]} />
			</NextIntlClientProvider>,
		);
		const pasteButton = screen.getByTestId("paste-button");

		fireEvent.click(pasteButton);

		await waitFor(() => {
			expect(screen.getByLabelText("URL")).toHaveValue(clipboardText);
		});
	});
});
