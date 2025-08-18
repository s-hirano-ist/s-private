import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchableCardLayout } from "./searchable-card-layout";

const meta = {
	component: SearchableCardLayout,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof SearchableCardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = [
	{ id: "1", title: "Apple", description: "A red fruit" },
	{ id: "2", title: "Banana", description: "A yellow fruit" },
	{ id: "3", title: "Cherry", description: "A small red fruit" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCard = (item: any, _index: number) => (
	<div className="p-4 border rounded-lg" key={item.id}>
		<h3 className="font-bold">{item.title}</h3>
		<p className="text-sm text-gray-600">{item.description}</p>
	</div>
);

export const Default: Story = {
	args: {
		searchQuery: "",
		searchResults: mockData,
		handleSearchChange: async () => {},
		renderCard,
		gridClassName: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
	},
};

export const WithSearchQuery: Story = {
	args: {
		searchQuery: "apple",
		searchResults: [mockData[0]],
		handleSearchChange: async () => {},
		renderCard,
		gridClassName: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
	},
};

export const EmptyResults: Story = {
	args: {
		searchQuery: "orange",
		searchResults: [],
		handleSearchChange: async () => {},
		renderCard,
		gridClassName: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
	},
};
