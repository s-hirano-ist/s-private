import { Footer } from "@/components/nav/footer";
import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { type Mock, describe, expect, it, vi } from "vitest";

// テストスイート
describe("Footer Component", () => {
	it("renders the footer component correctly", () => {
		// パス名をホームに設定
		(usePathname as Mock).mockReturnValue("/");

		// コンポーネントをレンダリング
		render(<Footer />);

		// 各ボタンが存在するか確認
		expect(screen.getByText(/DUMPER/i)).toBeInTheDocument();
		expect(screen.getByText(/CONTENTS/i)).toBeInTheDocument();
		expect(screen.getByText(/SEARCH/i)).toBeInTheDocument();
		expect(screen.getByText(/AI/i)).toBeInTheDocument();

		expect(screen.getByRole("button", { name: /Action/i })).toBeInTheDocument();
	});

	it("highlights the correct button based on pathname", () => {
		(usePathname as Mock).mockReturnValue("/contents");

		render(<Footer />);

		const contentsButton = screen.getByText(/CONTENTS/i).closest("button");
		expect(contentsButton).toHaveClass("bg-black/40");

		const dumperButton = screen.getByText(/DUMPER/i).closest("button");
		expect(dumperButton).not.toHaveClass("bg-black/40");
	});

	it("opens the drawer when the Action button is clicked", () => {
		render(<Footer />);

		const actionButton = screen.getByRole("button", { name: /Action/i });
		fireEvent.click(actionButton);

		// TODO: expect(screen.getByTestId("drawer-content")).toBeInTheDocument();
	});

	it("renders the DUMPER link", () => {
		render(<Footer />);
		const dumperLink = screen.getByRole("link", { name: "DUMPER" });
		expect(dumperLink).toBeInTheDocument();
		expect(dumperLink).toHaveAttribute("href", "/");
	});
	it("renders the VIEWER link", () => {
		render(<Footer />);
		const contentsLink = screen.getByRole("link", { name: "VIEWER" });
		expect(contentsLink).toBeInTheDocument();
		expect(contentsLink).toHaveAttribute("href", "/contents");
	});
	it("renders the PROFILE link", () => {
		render(<Footer />);
		const searchLink = screen.getByRole("link", { name: "SEARCH" });
		expect(searchLink).toBeInTheDocument();
		expect(searchLink).toHaveAttribute("href", "/search");
	});
	it("renders the ADMIN link", () => {
		render(<Footer />);
		const AILink = screen.getByRole("link", { name: "AI" });
		expect(AILink).toBeInTheDocument();
		expect(AILink).toHaveAttribute("href", "/ai");
	});
});
