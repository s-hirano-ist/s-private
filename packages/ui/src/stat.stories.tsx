import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stat, StatDescription, StatTitle, StatValue } from "./stat.js";

const meta = {
	component: Stat,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Stat>
			<StatTitle>Total articles</StatTitle>
			<StatValue>1,234</StatValue>
			<StatDescription>+12% from last month</StatDescription>
		</Stat>
	),
};

export const WithoutDescription: Story = {
	render: () => (
		<Stat>
			<StatTitle>Unread notes</StatTitle>
			<StatValue>42</StatValue>
		</Stat>
	),
};
