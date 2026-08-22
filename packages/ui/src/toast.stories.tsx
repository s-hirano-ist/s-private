import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button.js";
import { ToastProvider, useToast } from "./toast.js";

const meta = {
	component: ToastProvider,
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToastExample() {
	const toast = useToast();
	return <Button onClick={() => toast.success("Saved")}>Show Toast</Button>;
}

export const Default: Story = {
	args: { children: null },
	render: () => (
		<ToastProvider>
			<ToastExample />
		</ToastProvider>
	),
};
