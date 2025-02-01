import type { Meta, StoryObj } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import { Footer } from "./footer";

const meta = {
	title: "Components/Nav/Footer",
	component: Footer,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => {
		<NextIntlClientProvider>
			<Footer />
		</NextIntlClientProvider>;
	},
};
