import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
	type Props as ImageCounterProps,
	ImagesCounter,
} from "./images-counter";

function ImagesCounterWrapper({ count }: ImageCounterProps) {
	return <ImagesCounter count={count} />;
}

const meta = {
	component: ImagesCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		count: { control: "number" },
	},
} satisfies Meta<typeof ImagesCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	args: {
		count: 42,
	},
};

export const Empty: Story = {
	args: {
		count: 0,
	},
};

export const LargeCounts: Story = {
	args: {
		count: 1000,
	},
};
