import { AddImageForm } from "@/features/image/components/add-image-form";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

describe("AddImageForm", () => {
	it("renders input fields and buttons correctly", () => {
		const messages = {
			label: {
				image: "画像",
				upload: "アップロード",
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
