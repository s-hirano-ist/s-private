import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusCodeView } from "./status-code-view";

const meta = {
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
