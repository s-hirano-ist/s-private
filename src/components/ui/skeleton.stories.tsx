import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "@/components/ui/skeleton";

const meta = {
	title: "Components/UI/Skeleton",
	component: Skeleton,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => <Skeleton className="h-6 w-32" />,
};

export const CustomHeight: Story = {
	render: () => <Skeleton className="h-12 w-32" />,
};

export const CustomWidth: Story = {
	render: () => <Skeleton className="h-6 w-32" />,
};

export const Rounded: Story = {
	render: () => <Skeleton className="h-6 w-32 rounded-full" />,
};

export const Square: Story = {
	render: () => <Skeleton className="size-6" />,
};

export const CustomColor: Story = {
	render: () => <Skeleton className="h-6 w-32 bg-blue-200" />,
};

export const MultipleSkeletons: Story = {
	render: () => (
		<div className="space-y-2">
			<Skeleton className="h-6 w-64" />
			<Skeleton className="h-6 w-32" />
			<Skeleton className="h-6 w-32" />
		</div>
	),
};
