import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SmallCard } from "./small-card";

describe("SmallCard", () => {
	it("renders the SmallCard with all props", () => {
		const props = {
			id: 1,
			title: "Test Title",
			quote: "Test Quote",
			url: "https://example.com",
			category: "Test Category",
		};

		render(<SmallCard {...props} />);

		expect(screen.getByText("1")).toBeInTheDocument();

		expect(screen.getByText("Test Category")).toBeInTheDocument();

		expect(screen.getByText("Test Title")).toBeInTheDocument();

		expect(screen.getByText("Test Quote")).toBeInTheDocument();

		const link = screen.getByRole("link", { name: /test title/i });
		expect(link).toHaveAttribute("href", "https://example.com/");
		expect(link).toHaveAttribute("target", "_blank");
	});

	it("renders the SmallCard without optional props", () => {
		const props = {
			id: 2,
			title: "No Category or Quote",
			quote: null,
			url: "https://example.com",
		};

		render(<SmallCard {...props} />);

		expect(screen.getByText("2")).toBeInTheDocument();

		expect(screen.queryByText("Test Category")).not.toBeInTheDocument();

		expect(screen.getByText("No Category or Quote")).toBeInTheDocument();

		const description = screen.getByText((content, element) => {
			return element?.textContent === "　";
		});
		expect(description).toBeInTheDocument();

		const link = screen.getByRole("link", { name: /no category or quote/i });
		expect(link).toHaveAttribute("href", "https://example.com/");
		expect(link).toHaveAttribute("target", "_blank");
	});
});
