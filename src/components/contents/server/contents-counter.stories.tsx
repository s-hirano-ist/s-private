import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import type { Props as ContentsConterProps } from "./contents-counter";
import { ContentsCounter } from "./contents-counter";

function ContentsCounterWrapper({ getContentsCount }: ContentsConterProps) {
	return (
		<Suspense>
			<ContentsCounter getContentsCount={getContentsCount} />
		</Suspense>
	);
}

const meta = {
	component: ContentsCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		getContentsCount: { action: "getContentsCount" },
	},
} satisfies Meta<typeof ContentsCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		getContentsCount: async () => 42,
	},
};

export const Empty: Story = {
	args: {
		getContentsCount: async () => 0,
	},
};

export const LargeCounts: Story = {
	args: {
		getContentsCount: async () => 1000,
	},
};
