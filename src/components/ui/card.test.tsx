import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card";

describe("Card components", () => {
	it("renders Card component correctly", () => {
		render(<Card>Card Content</Card>);
		const card = screen.getByText("Card Content");
		expect(card).toBeInTheDocument();
		expect(card).toHaveClass(
			"rounded-xl border bg-card text-card-foreground shadow",
		);
	});

	it("renders CardHeader component correctly", () => {
		render(<CardHeader>Card Header</CardHeader>);
		const cardHeader = screen.getByText("Card Header");
		expect(cardHeader).toBeInTheDocument();
		expect(cardHeader).toHaveClass("flex flex-col space-y-1.5 p-6");
	});

	it("renders CardTitle component correctly", () => {
		render(<CardTitle>Card Title</CardTitle>);
		const cardTitle = screen.getByText("Card Title");
		expect(cardTitle).toBeInTheDocument();
		expect(cardTitle).toHaveClass(
			"font-bold leading-none tracking-tight bg-gradient-to-r from-primary text-transparent bg-clip-text to-primary-grad-from",
		);
	});

	it("renders CardDescription component correctly", () => {
		render(<CardDescription>Card Description</CardDescription>);
		const cardDescription = screen.getByText("Card Description");
		expect(cardDescription).toBeInTheDocument();
		expect(cardDescription).toHaveClass("text-sm text-muted-foreground");
	});

	it("renders CardContent component correctly", () => {
		render(<CardContent>Card Content Area</CardContent>);
		const cardContent = screen.getByText("Card Content Area");
		expect(cardContent).toBeInTheDocument();
		expect(cardContent).toHaveClass("p-6 pt-0");
	});

	it("renders CardFooter component correctly", () => {
		render(<CardFooter>Card Footer</CardFooter>);
		const cardFooter = screen.getByText("Card Footer");
		expect(cardFooter).toBeInTheDocument();
		expect(cardFooter).toHaveClass("flex items-center p-6 pt-0");
	});

	it("applies additional className to Card component", () => {
		render(<Card className="bg-white">Card with Custom Class</Card>);
		const card = screen.getByText("Card with Custom Class");
		expect(card).toBeInTheDocument();
		expect(card).toHaveClass("bg-white");
	});

	it("applies additional className to CardHeader component", () => {
		render(
			<CardHeader className="bg-white">
				CardHeader with Custom Class
			</CardHeader>,
		);
		const cardHeader = screen.getByText("CardHeader with Custom Class");
		expect(cardHeader).toBeInTheDocument();
		expect(cardHeader).toHaveClass("bg-white");
	});
});
