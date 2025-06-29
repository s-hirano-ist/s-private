import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import QueryClientProvider from "@/components/provider/query-provider";
import { ViewerBody } from "./viewer-body";

const meta = {
	title: "Components/Body/ViewerBody",
	component: ViewerBody,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ViewerBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { markdown: "sample string" },
	render: (args) => (
		<QueryClientProvider>
			<ViewerBody markdown={args.markdown} />
		</QueryClientProvider>
	),
};
