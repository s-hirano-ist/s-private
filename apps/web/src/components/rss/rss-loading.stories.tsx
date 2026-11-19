import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RssLoading } from "@/components/rss/rss-loading";
import { Suspense, use } from "react";
import { expect } from "storybook/test";

const meta = {
	component: RssLoading,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RssLoading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("status")).toHaveAccessibleName(
			"読み込み中…",
		);
	},
};

const pending = new Promise<never>(() => {});
function PendingReader() {
	use(pending);
	return null;
}
export const Suspended: Story = {
	render: () => (
		<Suspense fallback={<RssLoading />}>
			<PendingReader />
		</Suspense>
	),
	play: async ({ canvas }) => {
		await expect(await canvas.findByRole("status")).toHaveAccessibleName(
			"読み込み中…",
		);
	},
};
