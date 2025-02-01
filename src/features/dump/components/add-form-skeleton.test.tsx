import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { AddFormSkeleton } from "./add-form-skeleton";

describe("AddFormSkeleton", () => {
	it("renders correctly when showCategory is true", () => {
		const messages = {
			label: {
				category: "カテゴリー",
				title: "タイトル",
				url: "URL",
				description: "ひとこと",
			},
		};
		render(
			<NextIntlClientProvider locale="ja" messages={messages}>
				<AddFormSkeleton showCategory={true} />
			</NextIntlClientProvider>,
		);

		// カテゴリーラベルとスケルトンが表示されることを確認
		expect(screen.queryByText("カテゴリー")).toBeInTheDocument();
		expect(screen.getAllByRole("presentation")).toHaveLength(4);
	});

	it("renders correctly when showCategory is false", () => {
		const messages = {
			label: {
				category: "カテゴリー",
				title: "タイトル",
				url: "URL",
				description: "ひとこと",
			},
		};
		render(
			<NextIntlClientProvider locale="ja" messages={messages}>
				<AddFormSkeleton showCategory={false} />
			</NextIntlClientProvider>,
		);

		// カテゴリーラベルが表示されないことを確認
		expect(screen.queryByText("カテゴリー")).not.toBeInTheDocument();
		expect(screen.getAllByRole("presentation")).toHaveLength(3);
	});

	it("renders texts and skeletons for title, quote, and URL", () => {
		const messages = {
			label: {
				category: "カテゴリー",
				title: "タイトル",
				url: "URL",
				description: "ひとこと",
			},
		};
		render(
			<NextIntlClientProvider locale="ja" messages={messages}>
				<AddFormSkeleton showCategory={false} />
			</NextIntlClientProvider>,
		);

		// 各ラベルが正しく表示されることを確認
		expect(screen.getByText("タイトル")).toBeInTheDocument();
		expect(screen.getByText("ひとこと")).toBeInTheDocument();
		expect(screen.getByText("URL")).toBeInTheDocument();

		// Skeleton 要素が存在することを確認
		expect(screen.getAllByRole("presentation")).toHaveLength(3);
	});
});
