import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { toast } from "sonner";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ServerAction } from "@/common/types";
import { ImageFormClient } from "./image-form-client";

vi.mock("sonner");

const mockToast = vi.mocked(toast);

const messages = {
	label: {
		save: "save",
		image: "Image",
		uploading: "Uploading...",
		upload: "Upload",
	},
	message: {
		success: "Success",
		error: "Error",
	},
	button: {
		uploading: "Uploading...",
		upload: "Upload",
	},
};

describe("ImageFormClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const renderComponent = (
		addImage: (formData: FormData) => Promise<ServerAction>,
	) => {
		return render(
			<NextIntlClientProvider locale="en" messages={messages}>
				<ImageFormClient addImage={addImage} />
			</NextIntlClientProvider>,
		);
	};

	test("should render image form", () => {
		const mockAddImage = vi.fn();
		renderComponent(mockAddImage);

		expect(screen.getByLabelText("Image")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
	});

	test("should handle empty file list", async () => {
		const user = userEvent.setup();
		const mockAddImage = vi.fn();

		renderComponent(mockAddImage);

		const uploadButton = screen.getByRole("button", { name: "Upload" });
		await user.click(uploadButton);

		// Should not call addImage if no files are selected
		expect(mockAddImage).not.toHaveBeenCalled();
		expect(mockToast).not.toHaveBeenCalled();
	});
});
