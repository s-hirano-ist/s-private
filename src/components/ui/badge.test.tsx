import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge component", () => {
	it("renders correctly with default props", () => {
		render(<Badge>Default Badge</Badge>);
		const badge = screen.getByText("Default Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass(
			"inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gradient-to-r from-primary-grad-from to-primary-grad-to text-white shadow hover:bg-secondary/80",
		);
	});

	it("renders correctly with variant prop", () => {
		render(<Badge variant="secondary">Secondary Badge</Badge>);
		const badge = screen.getByText("Secondary Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass(
			"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		);
	});

	it("renders correctly with outline variant", () => {
		render(<Badge variant="outline">Outline Badge</Badge>);
		const badge = screen.getByText("Outline Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("text-foreground");
	});

	it("applies additional className", () => {
		render(<Badge className="bg-black">Custom Class Badge</Badge>);
		const badge = screen.getByText("Custom Class Badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("bg-black");
	});
});
