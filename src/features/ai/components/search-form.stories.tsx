import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import { SearchForm } from "./search-form";

const meta = {
	component: SearchForm,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof SearchForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { onSearch: fn() },
};

export const WithInitialQuery: Story = {
	args: {
		initialQuery: "sample search query",
		onSearch: fn(),
	},
};

export const EmptyInitialQuery: Story = {
	args: {
		initialQuery: "",
		onSearch: fn(),
	},
};
