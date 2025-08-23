import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
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
		<div className="max-w-sm mx-auto">
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
	tags: ["autodocs"],
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
