import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const meta = {
	title: "Components/UI/Tabs",
	component: Tabs,
	tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Tabs className="w-[400px]" defaultValue="account">
			<TabsList>
				<TabsTrigger value="account">Account</TabsTrigger>
				<TabsTrigger value="password">Password</TabsTrigger>
			</TabsList>
			<TabsContent value="account">
				Make changes to your account here.
			</TabsContent>
			<TabsContent value="password">Change your password here.</TabsContent>
		</Tabs>
	),
};
