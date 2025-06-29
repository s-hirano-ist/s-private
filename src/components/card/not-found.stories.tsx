import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { NotFound } from "./not-found";

const meta = {
	title: "Components/Card/NotFound",
	component: NotFound,
	parameters: { layout: "centered" },
} satisfies Meta<typeof NotFound>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<NextIntlClientProvider locale="ja">
			<NotFound />
		</NextIntlClientProvider>
	),
};
