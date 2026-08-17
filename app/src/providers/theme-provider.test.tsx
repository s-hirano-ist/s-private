import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ThemeProvider } from "./theme-provider";

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
	test("forwards the request nonce to next-themes", () => {
		const { getByTestId } = render(
			<ThemeProvider nonce="request-nonce">
				<div data-testid="content" />
			</ThemeProvider>,
		);

		expect(getByTestId("content").parentElement).toHaveAttribute(
			"data-nonce",
			"request-nonce",
		);
	});

	test("renders without a nonce", () => {
		const { getByTestId } = render(
			<ThemeProvider>
				<div data-testid="content" />
			</ThemeProvider>,
		);

		expect(getByTestId("content").parentElement).not.toHaveAttribute(
			"data-nonce",
		);
	});
});
