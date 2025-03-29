import { AddImageForm } from "@/features/image/components/add-image-form";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, test } from "vitest";

describe("AddImageForm", () => {
	test("renders input fields and buttons correctly", () => {
		const messages = {
			label: {
				image: "画像",
				upload: "アップロード",
				uploading: "アップロード中...",
			},
			message: {
				inserted: "正常に登録されました",
			},
		};

		render(
			<NextIntlClientProvider locale="ja" messages={messages}>
				<AddImageForm />
			</NextIntlClientProvider>,
		);

		expect(screen.getByLabelText("画像")).toBeInTheDocument();
		expect(screen.getByText("アップロード")).toBeInTheDocument();
	});
});
