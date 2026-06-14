import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { toast, Toaster } from "./toast";

const meta = {
	component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

function ToastExample() {
	const handleToast = () => {
		toast("sample description");
	};

	return <Button onClick={handleToast}>Show Toast</Button>;
}

export const Default: Story = {
	render: () => <ToastExample />,
};
