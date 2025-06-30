import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const meta = {
	title: "Components/UI/Select",
	component: Select,
	tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Select>
			<SelectTrigger className="w-[180px]">
				<SelectValue placeholder="Theme" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="light">Light</SelectItem>
				<SelectItem value="dark">Dark</SelectItem>
				<SelectItem value="system">System</SelectItem>
			</SelectContent>
		</Select>
	),
};
