import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormStatus } from "react-dom";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { SubmitButton } from "./submit-button";

vi.mock("react-dom", () => ({
	useFormStatus: vi.fn(),
}));

describe("SubmitButton", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("renders the button with the correct label", () => {
		(useFormStatus as Mock).mockReturnValue({ pending: false });

		render(<SubmitButton label="Submit" />);
		expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
	});

	it("disables the button when pending is true", () => {
		(useFormStatus as Mock).mockReturnValue({ pending: true });

		render(<SubmitButton label="Submit" />);
		const button = screen.getByRole("button", { name: /submit/i });
		expect(button).toBeDisabled();
	});

	it("is clickable when not pending", async () => {
		(useFormStatus as Mock).mockReturnValue({ pending: false });

		const user = userEvent.setup();
		render(<SubmitButton label="Submit" />);

		const button = screen.getByRole("button", { name: /submit/i });

		await user.click(button);

		expect(button).not.toBeDisabled();
	});
});
