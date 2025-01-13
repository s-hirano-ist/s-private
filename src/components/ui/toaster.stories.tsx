import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Toaster } from "./toaster";

const meta = {
	title: "Components/UI/Toaster",
	component: Toaster,
	tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

const ToastExample = () => {
	const { toast } = useToast();

	const handleToast = () => {
		toast({
			variant: "default",
			description: "sample description",
		});
	};

	return (
		<>
			<Toaster />
			<Button onClick={handleToast}>Show Toast</Button>
		</>
	);
};

export const Default: Story = {
	render: () => <ToastExample />,
};
