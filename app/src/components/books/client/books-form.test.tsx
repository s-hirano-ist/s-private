import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { BooksForm } from "./books-form";

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => {
		const translations: Record<string, string> = {
			title: "Title",
		};
		return translations[key] || key;
	},
}));

vi.mock("@s-hirano-ist/s-ui/forms/fields/form-input", () => ({
	FormInput: ({
		label,
		name,
		placeholder,
		required,
	}: {
		label: string;
		name: string;
		placeholder?: string;
		required?: boolean;
	}) => (
		<input
			aria-label={label}
			data-testid={`form-input-${name}`}
			name={name}
			placeholder={placeholder}
			required={required}
		/>
	),
}));

vi.mock("@s-hirano-ist/s-ui/forms/generic-form-wrapper", () => ({
	GenericFormWrapper: ({
		children,
		action,
	}: {
		children: React.ReactNode;
		action: (...args: unknown[]) => unknown;
	}) => (
		<form data-action={action.name} data-testid="form-wrapper">
			{children}
		</form>
	),
}));

describe("BooksForm", () => {
	test("should render form with ISBN and title inputs", () => {
		const mockAddBooks = vi.fn().mockResolvedValue({ message: "Success" });

		render(<BooksForm addBooks={mockAddBooks} />);

		expect(screen.getByTestId("form-wrapper")).toBeInTheDocument();
		expect(screen.getByTestId("form-input-isbn")).toBeInTheDocument();
		expect(screen.getByTestId("form-input-title")).toBeInTheDocument();
	});

	test("should render ISBN input with correct props", () => {
		const mockAddBooks = vi.fn().mockResolvedValue({ message: "Success" });

		render(<BooksForm addBooks={mockAddBooks} />);

		const isbnInput = screen.getByTestId("form-input-isbn");
		expect(isbnInput).toHaveAttribute("name", "isbn");
		expect(isbnInput).toHaveAttribute("placeholder", "978-4-XXXX-XXXX-X");
		expect(isbnInput).toHaveAttribute("aria-label", "ISBN");
		expect(isbnInput).toHaveAttribute("required");
	});

	test("should render title input with correct props", () => {
		const mockAddBooks = vi.fn().mockResolvedValue({ message: "Success" });

		render(<BooksForm addBooks={mockAddBooks} />);

		const titleInput = screen.getByTestId("form-input-title");
		expect(titleInput).toHaveAttribute("name", "title");
		expect(titleInput).toHaveAttribute("aria-label", "Title");
		expect(titleInput).toHaveAttribute("required");
	});

	test("should pass action to form wrapper", () => {
		const mockAddBooks = vi.fn().mockResolvedValue({ message: "Success" });

		render(<BooksForm addBooks={mockAddBooks} />);

		const formWrapper = screen.getByTestId("form-wrapper");
		// The action is passed to the form wrapper - checking that it exists is sufficient
		expect(formWrapper).toBeInTheDocument();
		expect(formWrapper).toHaveAttribute("data-action");
	});
});
