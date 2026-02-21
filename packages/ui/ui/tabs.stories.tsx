import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
	component: Tabs,
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(
			canvas.getByText("Make changes to your account here."),
		).toBeInTheDocument();

		const passwordTab = canvas.getByRole("tab", { name: "Password" });
		await userEvent.click(passwordTab);

		await waitFor(() =>
			expect(
				canvas.getByText("Change your password here."),
			).toBeInTheDocument(),
		);

		const accountTab = canvas.getByRole("tab", { name: "Account" });
		await userEvent.click(accountTab);

		await waitFor(() =>
			expect(
				canvas.getByText("Make changes to your account here."),
			).toBeInTheDocument(),
		);
	},
};
