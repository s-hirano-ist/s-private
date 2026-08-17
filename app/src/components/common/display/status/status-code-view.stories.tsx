import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusCodeView } from "./status-code-view";

const meta = {
	component: StatusCodeView,
	parameters: { layout: "centered" },
} satisfies Meta<typeof StatusCodeView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CommingSoon: Story = {
	args: { statusCode: "000", statusCodeString: "Coming Soon" },
};

export const NoContent: Story = {
	args: { statusCode: "204", statusCodeString: "No Content" },
};

export const Forbidden: Story = {
	args: { statusCode: "403", statusCodeString: "Forbidden" },
};

export const NotFound: Story = {
	args: { statusCode: "404", statusCodeString: "Not Found" },
};

export const InternalServerError: Story = {
	args: { statusCode: "500", statusCodeString: "Internal Server Error" },
};
