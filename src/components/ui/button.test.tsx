import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button component", () => {
	it("renders correctly with default props", () => {
		render(<Button>Default Button</Button>);
		const button = screen.getByRole("button", { name: /default button/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass(
			"  inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary-grad-from to-primary-grad-to text-primary-grad shadow hover:bg-black/40 h-9 px-4 py-2",
		);
	});

	it("renders correctly with variant prop", () => {
		render(<Button variant="destructive">Destructive Button</Button>);
		const button = screen.getByRole("button", { name: /destructive button/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass(
			"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
		);
	});

	it("renders correctly with size prop", () => {
		render(<Button size="lg">Large Button</Button>);
		const button = screen.getByRole("button", { name: /large button/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("h-10 rounded-md px-8");
	});

	it("renders correctly with asChild prop", () => {
		render(
			<Button asChild>
				<a href="/test">Link Button</a>
			</Button>,
		);
		const link = screen.getByRole("link", { name: /link button/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/test");
	});
});
