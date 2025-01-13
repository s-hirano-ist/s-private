import type { Meta, StoryObj } from "@storybook/react";
import { ViewerBody } from "./viewer-body";

const meta = {
	title: "Features/Viewer/ViewerBody",
	component: ViewerBody,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ViewerBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { children: <div>sample</div> },
};
