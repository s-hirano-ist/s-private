import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { NextIntlClientProvider } from "next-intl";
import { UtilButtons } from "./util-buttons";

const meta = {
	title: "Features/Dump/UtilButtons",
	component: UtilButtons,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof UtilButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		handleReload: fn(),
		onSignOutSubmit: fn(),
	},
	render: () => (
		<NextIntlClientProvider locale="ja">
			<UtilButtons handleReload={fn()} onSignOutSubmit={fn()} />
		</NextIntlClientProvider>
	),
};
