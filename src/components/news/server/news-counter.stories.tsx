import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import type { Props as NewsCounterProps } from "./news-counter";
import { NewsCounter } from "./news-counter";

function NewsCounterWrapper({ getNewsCount }: NewsCounterProps) {
	return (
		<Suspense>
			<NewsCounter getNewsCount={getNewsCount} />
		</Suspense>
	);
}

const meta = {
	component: NewsCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		getNewsCount: { action: "getNewsCount" },
	},
} satisfies Meta<typeof NewsCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		getNewsCount: async () => 42,
	},
};

export const Empty: Story = {
	args: {
		getNewsCount: async () => 0,
	},
};

export const LargeCounts: Story = {
	args: {
		getNewsCount: async () => 1000,
	},
};
