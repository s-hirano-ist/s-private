import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { StatusCodeView } from "./status-code-view";

const meta = {
	title: "Components/Card/StatusCodeView",
	component: StatusCodeView,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof StatusCodeView>;

export default meta;

type Story = StoryObj<typeof meta>;

const messages = {
	statusCode: {
		"000": "近日公開",
		"204": "コンテンツがありません",
		"403": "許可されていません",
		"404": "コンテンツが見つかりません",
		"500": "予期せぬエラーが発生しました",
		XXX: "XXX",
	},
};

export const CommingSoon: Story = {
	args: { statusCode: "000" },
	render: () => (
		<NextIntlClientProvider locale="ja" messages={messages}>
			<StatusCodeView statusCode="000" />
		</NextIntlClientProvider>
	),
};

export const NoContent: Story = {
	args: { statusCode: "204" },
	render: () => (
		<NextIntlClientProvider locale="ja" messages={messages}>
			<StatusCodeView statusCode="204" />
		</NextIntlClientProvider>
	),
};

export const Forbidden: Story = {
	args: { statusCode: "403" },
	render: () => (
		<NextIntlClientProvider locale="ja" messages={messages}>
			<StatusCodeView statusCode="403" />
		</NextIntlClientProvider>
	),
};

export const NotFound: Story = {
	args: { statusCode: "404" },
	render: () => (
		<NextIntlClientProvider locale="ja" messages={messages}>
			<StatusCodeView statusCode="404" />
		</NextIntlClientProvider>
	),
};

export const InternalServerError: Story = {
	args: { statusCode: "500" },
	render: () => (
		<NextIntlClientProvider locale="ja" messages={messages}>
			<StatusCodeView statusCode="500" />
		</NextIntlClientProvider>
	),
};

export const UnknownStatus: Story = {
	// @ts-expect-error: check status code error message
	args: { statusCode: "XXX" },
	render: () => (
		<NextIntlClientProvider locale="ja" messages={messages}>
			{/* @ts-expect-error: check status code error message */}
			<StatusCodeView statusCode="XXX" />
		</NextIntlClientProvider>
	),
};
