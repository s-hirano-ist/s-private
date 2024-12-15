import { signOut } from "@/features/auth/actions/sign-out";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./header";

vi.mock("@/features/auth/actions/sign-out", () => ({
	signOut: vi.fn(),
}));

const toastMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
	useToast: vi.fn(() => ({ toast: toastMock })),
}));

describe("Header", () => {
	vi.mock("next-view-transitions", () => ({
		useTransitionRouter: vi.fn(() => ({ push: vi.fn() })),
	}));

	it("renders the title", () => {
		render(<Header title="Test Title" />);
		expect(screen.getByText("Test Title")).toBeInTheDocument();
	});

	it("calls signOut on sign-out", async () => {
		vi.mocked(signOut).mockResolvedValueOnce({
			success: true,
			message: "サインアウトに成功しました。",
			data: undefined,
		});

		const user = userEvent.setup();
		render(<Header title="Dashboard" />);

		const button = screen.getByTestId("log-out-button");
		await user.click(button);

		expect(signOut).toHaveBeenCalledTimes(1);
		expect(signOut).toHaveBeenCalled();

		// TODO: 各関数が呼び出されていることを確認する?
	});

	it("shows a toast on sign-out failure", async () => {
		vi.mocked(signOut).mockResolvedValueOnce({
			success: false,
			message: "サインアウトに失敗しました。",
		});

		const user = userEvent.setup();
		render(<Header title="Dashboard" />);

		const button = screen.getByTestId("log-out-button");
		await user.click(button);

		expect(toastMock).toHaveBeenCalledTimes(1);
		expect(toastMock).toHaveBeenCalledWith({
			variant: "destructive",
			description: "サインアウトに失敗しました。",
		});
	});
});
