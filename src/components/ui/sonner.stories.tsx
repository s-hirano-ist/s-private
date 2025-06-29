import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toaster as Sonner } from "./sonner";

const meta = {
	title: "Components/UI/Sonner",
	component: Sonner,
	tags: ["autodocs"],
} satisfies Meta<typeof Sonner>;

export default meta;

type Story = StoryObj<typeof meta>;

function SonnerExample() {
	const handleToast = () => {
		toast("sample description");
	};

	return (
		<>
			<Sonner />
			<Button onClick={handleToast}>Show Toast</Button>
		</>
	);
}

export const Default: Story = {
	render: () => <SonnerExample />,
};
