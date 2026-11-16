import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppNavigation } from "@/components/common/layouts/nav/app-navigation";
import { expect, fn, within } from "storybook/test";
import { SettingsActions } from "./settings-actions";

const meta = {
	component: SettingsActions,
	args: {
		getPushStatus: fn().mockResolvedValue({
			success: false,
			message: "unexpected",
		}),
		sendTestPush: fn().mockResolvedValue({ message: "success", success: true }),
		subscribeToPush: fn().mockResolvedValue({
			message: "success",
			success: true,
		}),
		unsubscribeFromPush: fn().mockResolvedValue({
			message: "success",
			success: true,
		}),
	},
	parameters: {
		layout: "centered",
		nextjs: { appDirectory: true, navigation: { pathname: "/ja/settings" } },
	},
} satisfies Meta<typeof SettingsActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole("link", { name: "RSSの購読管理" }),
		).toHaveAttribute("href", "/ja/settings/rss");
		await expect(canvas.getByTestId("log-out-button")).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /再読み込み/u }),
		).toBeVisible();
	},
};

export const SettingsPage: Story = {
	parameters: { layout: "fullscreen" },
	render: (args) => (
		<div className="w-[960px] bg-background pb-24 text-foreground">
			<AppNavigation
				search={fn()}
				forms={{ articles: null, books: null, images: null, notes: null }}
			/>
			<main className="mx-auto max-w-xl px-3 pt-6 sm:px-0">
				<SettingsActions {...args} />
			</main>
		</div>
	),
	play: async ({ canvas }) => {
		const rss = canvas.getByRole("link", { name: "RSSの購読管理" });
		const reload = canvas.getByRole("button", { name: /再読み込み/u });
		await expect(rss).toBeVisible();
		await expect(rss.getBoundingClientRect().height).toBe(
			reload.getBoundingClientRect().height,
		);
		await expect(
			canvas.queryByRole("heading", { name: "設定" }),
		).not.toBeInTheDocument();
	},
};
export const MobileSettings: Story = {
	...SettingsPage,
	globals: { viewport: { value: "mobile1" } },
	render: (args) => (
		<div className="w-80 max-w-full bg-background pb-24 text-foreground">
			<AppNavigation
				search={fn()}
				forms={{ articles: null, books: null, images: null, notes: null }}
			/>
			<main className="mx-auto max-w-xl px-3 pt-6 sm:px-0">
				<SettingsActions {...args} />
			</main>
		</div>
	),
};
export const DarkSettings: Story = {
	...SettingsPage,
	globals: { theme: "dark", backgrounds: { value: "black" } },
};
