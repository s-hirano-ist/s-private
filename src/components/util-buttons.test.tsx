import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { beforeEach, describe, expect, Mock, test, vi } from "vitest";
import { redirect } from "@/i18n/routing";
import { UtilButtons } from "./util-buttons";

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
}));

vi.mock("next-intl", () => ({
	useLocale: vi.fn(),
	useTranslations: vi.fn(),
}));

vi.mock("next-themes", () => ({
	useTheme: vi.fn(),
}));

vi.mock("@/i18n/routing", () => ({
	// eslint-disable-next-line
	Link: ({ children, href }: any) => <a href={href}>{children}</a>,
	redirect: vi.fn(),
}));

vi.mock("@/constants", () => ({
	UTIL_URLS: [
		{ name: "Home", url: "/" },
		{ name: "About", url: "/about" },
		{ name: "Contact", url: "/contact" },
	],
}));

describe("UtilButtons", () => {
	const mockHandleReload = vi.fn();
	const mockOnSignOutSubmit = vi.fn();
	const mockSetTheme = vi.fn();
	const mockTranslations = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		(usePathname as Mock).mockReturnValue("/test-path");
		(useLocale as Mock).mockReturnValue("en");
		(useTheme as Mock).mockReturnValue({
			theme: "light",
			setTheme: mockSetTheme,
		});
		(useTranslations as Mock).mockReturnValue(mockTranslations);

		mockTranslations.mockImplementation((key: string) => {
			switch (key) {
				case "reload":
					return "Reload";
				case "appearance":
					return "Appearance";
				case "language":
					return "Language";
				case "signOut":
					return "Sign Out";
				default:
					return key;
			}
		});
	});

	test("should render all util URL buttons", () => {
		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.getByText("About")).toBeInTheDocument();
		expect(screen.getByText("Contact")).toBeInTheDocument();
	});

	test("should render utility action buttons", () => {
		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		expect(screen.getByText("Reload")).toBeInTheDocument();
		expect(screen.getByText("Appearance")).toBeInTheDocument();
		expect(screen.getByText("Language")).toBeInTheDocument();
		expect(screen.getByText("Sign Out")).toBeInTheDocument();
	});

	test("should call handleReload when reload button is clicked", () => {
		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const reloadButton = screen.getByText("Reload");
		fireEvent.click(reloadButton);

		expect(mockHandleReload).toHaveBeenCalledTimes(1);
	});

	test("should toggle theme when appearance button is clicked", () => {
		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const appearanceButton = screen.getByText("Appearance");
		fireEvent.click(appearanceButton);

		expect(mockSetTheme).toHaveBeenCalledWith("dark");
	});

	test("should toggle theme from dark to light", () => {
		(useTheme as Mock).mockReturnValue({
			theme: "dark",
			setTheme: mockSetTheme,
		});

		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const appearanceButton = screen.getByText("Appearance");
		fireEvent.click(appearanceButton);

		expect(mockSetTheme).toHaveBeenCalledWith("light");
	});

	test("should redirect with locale change when language button is clicked", () => {
		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const languageButton = screen.getByText("Language");
		fireEvent.click(languageButton);

		expect(redirect).toHaveBeenCalledWith({
			href: "/test-path",
			locale: "ja",
		});
	});

	test("should switch from ja to en locale", () => {
		(useLocale as Mock).mockReturnValue("ja");

		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const languageButton = screen.getByText("Language");
		fireEvent.click(languageButton);

		expect(redirect).toHaveBeenCalledWith({
			href: "/test-path",
			locale: "en",
		});
	});

	test("should remove language prefix from pathname", () => {
		(usePathname as Mock).mockReturnValue("/en/test-path");

		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const languageButton = screen.getByText("Language");
		fireEvent.click(languageButton);

		expect(redirect).toHaveBeenCalledWith({
			href: "/test-path",
			locale: "ja",
		});
	});

	test("should remove ja prefix from pathname", () => {
		(usePathname as Mock).mockReturnValue("/ja/test-path");
		(useLocale as Mock).mockReturnValue("ja");

		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const languageButton = screen.getByText("Language");
		fireEvent.click(languageButton);

		expect(redirect).toHaveBeenCalledWith({
			href: "/test-path",
			locale: "en",
		});
	});

	test("should call onSignOutSubmit when sign out button is clicked", () => {
		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const signOutButton = screen.getByTestId("log-out-button");
		fireEvent.click(signOutButton);

		expect(mockOnSignOutSubmit).toHaveBeenCalledTimes(1);
	});

	test("should not show sign out button on auth page", () => {
		(usePathname as Mock).mockReturnValue("/auth");

		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		expect(screen.queryByTestId("log-out-button")).not.toBeInTheDocument();
	});

	test("should have correct grid layout", () => {
		const { container } = render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const grid = container.firstChild;
		expect(grid).toHaveClass(
			"grid",
			"gap-2",
			"px-2",
			"grid-cols-1",
			"sm:grid-cols-3",
		);
	});

	test("should handle edge case with root path and language prefix", () => {
		(usePathname as Mock).mockReturnValue("/en");

		render(
			<UtilButtons
				handleReload={mockHandleReload}
				onSignOutSubmit={mockOnSignOutSubmit}
			/>,
		);

		const languageButton = screen.getByText("Language");
		fireEvent.click(languageButton);

		expect(redirect).toHaveBeenCalledWith({
			href: "/",
			locale: "ja",
		});
	});
});
