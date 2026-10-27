import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { reportRenderError } from "@/common/observability/report-render-error";
import { createTranslator } from "next-intl";
import { getTranslations } from "next-intl/server";
import { expect, mocked, waitFor } from "storybook/test";
import { ErrorBoundary } from "./error-boundary";

const meta = {
	component: ErrorBoundary,
	args: { errorCaller: "story-render" },
	beforeEach: () => {
		mocked(reportRenderError).mockReset();
		const messages: Record<string, string> = { "500": "Internal Server Error" };
		mocked(getTranslations).mockResolvedValue(
			createTranslator({ locale: "en", messages }),
		);
	},
} satisfies Meta<typeof ErrorBoundary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SuccessfulRender: Story = {
	args: { render: async () => <p>Content loaded</p> },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText("Content loaded")).toBeVisible(),
		);
		await expect(reportRenderError).not.toHaveBeenCalled();
	},
};

const failure = new Error("upstream unavailable");
const fail = async () => {
	throw failure;
};

export const DefaultError: Story = {
	args: { render: fail },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByRole("heading", { name: "500" })).toBeVisible(),
		);
		await expect(canvas.queryByText(failure.message)).not.toBeInTheDocument();
		await expect(reportRenderError).toHaveBeenCalledWith(
			failure,
			"story-render",
		);
	},
};

export const CustomFallback: Story = {
	args: { render: fail, fallback: <p>Unable to load content</p> },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText("Unable to load content")).toBeVisible(),
		);
		await expect(reportRenderError).toHaveBeenCalledWith(
			failure,
			"story-render",
		);
	},
};
