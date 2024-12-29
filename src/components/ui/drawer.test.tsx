import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./drawer";

beforeAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
	Object.defineProperty(window, "scrollTo", {
		writable: true,
		value: vi.fn(),
	});
});

describe.skip("Drawer components", () => {
	it("renders DrawerTrigger and opens DrawerContent", () => {
		render(
			<Drawer>
				<DrawerTrigger>Open Drawer</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Drawer Title</DrawerTitle>
						<DrawerDescription>Drawer Description</DrawerDescription>
					</DrawerHeader>
					<DrawerFooter>
						<DrawerClose>Close</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>,
		);

		// Triggerが表示されていることを確認
		const trigger = screen.getByText("Open Drawer");
		expect(trigger).toBeInTheDocument();

		// Triggerをクリックしてドロワーを開く
		fireEvent.click(trigger);

		// ドロワーの内容が表示されていることを確認
		const title = screen.getByText("Drawer Title");
		const description = screen.getByText("Drawer Description");
		const closeButton = screen.getByRole("button", { name: "Close" });
		expect(title).toBeInTheDocument();
		expect(description).toBeInTheDocument();
		expect(closeButton).toBeInTheDocument();
	});

	it("closes the drawer when DrawerClose is clicked", async () => {
		render(
			<Drawer>
				<DrawerTrigger>Open Drawer</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Drawer Title</DrawerTitle>
						<DrawerDescription>Drawer Description</DrawerDescription>
					</DrawerHeader>
					<DrawerFooter>
						<DrawerClose>Close</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>,
		);

		// Triggerをクリックしてドロワーを開く
		const trigger = screen.getByText("Open Drawer");
		fireEvent.click(trigger);

		// ドロワーの内容が表示されていることを確認
		const title = screen.getByText("Drawer Title");
		expect(title).toBeInTheDocument();

		// Closeボタンをクリックしてドロワーを閉じる
		const closeButton = screen.getByRole("button", { name: "Close" });
		fireEvent.click(closeButton);

		// ドロワーの内容が閉じられたことを確認
		// expect(title).not.toBeInTheDocument();
		await waitFor(() => {
			expect(title).not.toBeInTheDocument();
		});
	});

	it("applies additional className to DrawerContent", () => {
		render(
			<Drawer>
				<DrawerTrigger>Open Drawer</DrawerTrigger>
				<DrawerContent className="bg-white">
					<DrawerTitle>Drawer Title</DrawerTitle>
					<DrawerDescription>Drawer Description</DrawerDescription>
					Drawer Content
				</DrawerContent>
			</Drawer>,
		);

		// Triggerをクリックしてドロワーを開く
		const trigger = screen.getByText("Open Drawer");
		fireEvent.click(trigger);

		// ドロワーの内容が表示されていることを確認
		const content = screen.getByText("Drawer Content");
		expect(content).toBeInTheDocument();
		expect(content).toHaveClass("bg-white");
	});
});
