import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ThemeProvider } from "./theme-provider";

const { setNonce } = vi.hoisted(() => ({
	setNonce: vi.fn(),
}));

vi.mock("get-nonce", () => ({ setNonce }));

vi.mock("next-themes", () => ({
	ThemeProvider: ({
		children,
		nonce,
	}: {
		children: ReactNode;
		nonce?: string;
	}) => <div data-nonce={nonce}>{children}</div>,
}));

describe("ThemeProvider", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test("initializes dynamic style libraries with the request nonce", () => {
		const { getByTestId } = render(
			<ThemeProvider nonce="request-nonce">
				<div data-testid="content" />
			</ThemeProvider>,
		);

		expect(setNonce).toHaveBeenCalledWith("request-nonce");
		expect(getByTestId("content").parentElement).toHaveAttribute(
			"data-nonce",
			"request-nonce",
		);
	});

	test("clears a previously configured nonce when none is provided", () => {
		render(
			<ThemeProvider>
				<div />
			</ThemeProvider>,
		);

		expect(setNonce).toHaveBeenCalledWith("");
	});
});
