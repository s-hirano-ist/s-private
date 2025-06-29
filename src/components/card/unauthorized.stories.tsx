import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { Unauthorized } from "./unauthorized";

const meta = {
	title: "Components/Card/Unauthorized",
	component: Unauthorized,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Unauthorized>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<NextIntlClientProvider
			locale="ja"
			messages={{
				statusCode: { "403": "許可されていません" },
			}}
		>
			<Unauthorized />
		</NextIntlClientProvider>
	),
};
