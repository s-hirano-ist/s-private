import { AddContentsForm } from "@/features/contents/components/add-contents-form";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

describe("AddContentsForm", () => {
	it("renders input fields and buttons correctly", () => {
		const messages = {
			label: {
				save: "保存",
				title: "タイトル",
				url: "URL",
				description: "ひとこと",
			},
		};

		render(
			<NextIntlClientProvider locale="ja" messages={messages}>
				<AddContentsForm />
			</NextIntlClientProvider>,
		);
		expect(screen.getByLabelText("タイトル")).toBeInTheDocument();
		expect(screen.getByLabelText("ひとこと")).toBeInTheDocument();
		expect(screen.getByLabelText("URL")).toBeInTheDocument();
		expect(screen.getByText("保存")).toBeInTheDocument();
	});

	it("pastes clipboard content into the URL field", async () => {
		const clipboardText = "https://example.com";
		Object.assign(navigator, {
			clipboard: { readText: vi.fn().mockResolvedValue(clipboardText) },
		});

		const messages = {
			label: {
				save: "保存",
				title: "タイトル",
				url: "URL",
				description: "ひとこと",
			},
		};

		render(
			<NextIntlClientProvider messages={messages} locale="en">
				<AddContentsForm />
			</NextIntlClientProvider>,
		);
		const pasteButton = screen.getByTestId("paste-button");

		fireEvent.click(pasteButton);

		await waitFor(() => {
			expect(screen.getByLabelText("URL")).toHaveValue(clipboardText);
		});
	});
});
