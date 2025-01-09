import type { Meta, StoryObj } from "@storybook/react";
import { StatusCodeView } from "./status-code-view";

const meta = {
	title: "Components/StatusCodeView",
	component: StatusCodeView,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof StatusCodeView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CommingSoon: Story = {
	args: { statusCode: "000" },
};

export const NoContent: Story = {
	args: { statusCode: "204" },
};

export const Forbidden: Story = {
	args: { statusCode: "403" },
};

export const NotFound: Story = {
	args: { statusCode: "404" },
};

export const InternalServerError: Story = {
	args: { statusCode: "500" },
};

export const UnknownStatus: Story = {
	// @ts-expect-error: check status code error message
	args: { statusCode: "XXX" },
};
