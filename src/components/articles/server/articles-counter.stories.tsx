import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import type { Props as ArticlesCounterProps } from "./articles-counter";
import { ArticlesCounter } from "./articles-counter";

function ArticlesCounterWrapper({ getArticlesCount }: ArticlesCounterProps) {
	return (
		<Suspense>
			<ArticlesCounter getArticlesCount={getArticlesCount} />
		</Suspense>
	);
}

const meta = {
	component: ArticlesCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		getArticlesCount: { action: "getArticlesCount" },
	},
} satisfies Meta<typeof ArticlesCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		getArticlesCount: async () => 42,
	},
};

export const Empty: Story = {
	args: {
		getArticlesCount: async () => 0,
	},
};

export const LargeCounts: Story = {
	args: {
		getArticlesCount: async () => 1000,
	},
};
