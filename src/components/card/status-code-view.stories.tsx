import type { Meta, StoryObj } from "@storybook/react";
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

export const CommingSoon: Story = {
	args: { statusCode: "000" },
	render: () => (
		<NextIntlClientProvider locale="ja">
			<StatusCodeView statusCode="000" />
		</NextIntlClientProvider>
	),
};

export const NoContent: Story = {
	args: { statusCode: "204" },
	render: () => (
		<NextIntlClientProvider locale="ja">
			<StatusCodeView statusCode="204" />
		</NextIntlClientProvider>
	),
};

export const Forbidden: Story = {
	args: { statusCode: "403" },
	render: () => (
		<NextIntlClientProvider locale="ja">
			<StatusCodeView statusCode="403" />
		</NextIntlClientProvider>
	),
};

export const NotFound: Story = {
	args: { statusCode: "404" },
	render: () => (
		<NextIntlClientProvider locale="ja">
			<StatusCodeView statusCode="404" />
		</NextIntlClientProvider>
	),
};

export const InternalServerError: Story = {
	args: { statusCode: "500" },
	render: () => (
		<NextIntlClientProvider locale="ja">
			<StatusCodeView statusCode="500" />
		</NextIntlClientProvider>
	),
};

export const UnknownStatus: Story = {
	// @ts-expect-error: check status code error message
	args: { statusCode: "XXX" },
	render: () => (
		<NextIntlClientProvider locale="ja">
			{/* @ts-expect-error: check status code error message */}
			<StatusCodeView statusCode="XXX" />
		</NextIntlClientProvider>
	),
};
