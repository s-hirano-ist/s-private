import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
	render: () => (
		<NextIntlClientProvider
			locale="ja"
			messages={{
				utils: {
					utilsTitle: "便利ツール集",
					utilsDescription: "リンクをクリックしてください",
				},
			}}
		>
			<Footer />
		</NextIntlClientProvider>
	),
};
