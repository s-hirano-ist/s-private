import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import Page from "./page";

const meta = {
	component: Page,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<NextIntlClientProvider
			locale="ja"
			messages={{ statusCode: { "000": "近日公開" } }}
		>
			<Page />
		</NextIntlClientProvider>
	),
};
