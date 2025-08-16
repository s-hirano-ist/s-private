import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import Page from "./page";

function ErrorPageWrapper() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Page />
		</Suspense>
	);
}

const meta = {
	component: ErrorPageWrapper,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
} satisfies Meta<typeof ErrorPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
