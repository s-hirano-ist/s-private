import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { UtilButtons } from "./util-buttons";

type UtilButtonsWrapperProps = {
	handleReload: () => void;
	onSignOutSubmit: () => Promise<void>;
	pathname?: string;
	locale?: string;
	theme?: string;
};

function UtilButtonsWrapper({
	handleReload,
	onSignOutSubmit,
}: UtilButtonsWrapperProps) {
	return (
		<div className="mx-auto max-w-sm">
			<UtilButtons
				handleReload={handleReload}
				onSignOutSubmit={onSignOutSubmit}
			/>
		</div>
	);
}

const meta = {
	component: UtilButtonsWrapper,
	parameters: {
		layout: "centered",
		nextjs: {
			appDirectory: true,
		},
	},
	argTypes: {
		handleReload: { action: "handleReload" },
		onSignOutSubmit: { action: "onSignOutSubmit" },
		pathname: { control: "text" },
		locale: { control: { type: "select", options: ["en", "ja"] } },
		theme: { control: { type: "select", options: ["light", "dark"] } },
	},
} satisfies Meta<typeof UtilButtonsWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		handleReload: fn(),
		onSignOutSubmit: fn(),
	},
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en",
			},
		},
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);

		const buttons = canvas.getAllByRole("button");
		// First button is reload
		await userEvent.click(buttons[0]);
		await expect(args.handleReload).toHaveBeenCalled();

		// Fourth button is sign out (data-testid="log-out-button")
		const signOutButton = canvas.getByTestId("log-out-button");
		await userEvent.click(signOutButton);
		await expect(args.onSignOutSubmit).toHaveBeenCalled();
	},
};

export const DarkTheme: Story = {
	args: {
		handleReload: fn(),
		onSignOutSubmit: fn(),
		theme: "dark",
	},
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/en",
			},
		},
		themes: {
			default: "dark",
		},
	},
};

export const JapaneseLocale: Story = {
	args: {
		handleReload: fn(),
		onSignOutSubmit: fn(),
		locale: "ja",
	},
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/ja",
			},
		},
	},
};

export const OnAuthPage: Story = {
	args: {
		handleReload: fn(),
		onSignOutSubmit: fn(),
		pathname: "/auth",
	},
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/auth",
			},
		},
	},
};

export const DarkThemeJapanese: Story = {
	args: {
		handleReload: fn(),
		onSignOutSubmit: fn(),
		theme: "dark",
		locale: "ja",
	},
	parameters: {
		nextjs: {
			navigation: {
				pathname: "/ja",
			},
		},
		themes: {
			default: "dark",
		},
	},
};
