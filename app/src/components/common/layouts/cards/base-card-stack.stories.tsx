import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { BaseCardStackWrapper } from "./base-card-stack";

type MockItem = { id: string; title: string };

function BaseCardStackStory(
	props: Omit<
		React.ComponentProps<typeof BaseCardStackWrapper<MockItem>>,
		"children" | "gridClassName"
	>,
) {
	return (
		<BaseCardStackWrapper<MockItem>
			{...props}
			gridClassName="grid grid-cols-1 gap-2 sm:grid-cols-2"
		>
			{({ item, isLast, lastElementRef, itemKey }) => (
				<div
					className="rounded border p-4 shadow-sm"
					key={itemKey}
					ref={isLast ? lastElementRef : null}
				>
					<p className="font-medium">{item.title}</p>
				</div>
			)}
		</BaseCardStackWrapper>
	);
}

const meta = {
	component: BaseCardStackStory,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BaseCardStackStory>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockItems: MockItem[] = [
	{ id: "1", title: "First Item" },
	{ id: "2", title: "Second Item" },
	{ id: "3", title: "Third Item" },
];

const mockLoadMoreAction = fn(async () => ({
	success: true as const,
	message: "success",
	data: { data: [] as MockItem[], totalCount: 3 },
}));

export const Default: Story = {
	args: {
		initial: { data: mockItems, totalCount: 3 },
		loadMoreAction: mockLoadMoreAction,
	},
};

export const EmptyData: Story = {
	args: {
		initial: { data: [], totalCount: 0 },
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithDeleteAction: Story = {
	args: {
		initial: { data: mockItems, totalCount: 3 },
		loadMoreAction: mockLoadMoreAction,
		deleteAction: fn(),
	},
};

export const ManyItems: Story = {
	args: {
		initial: {
			data: Array.from({ length: 20 }, (_, i) => ({
				id: String(i + 1),
				title: `Item ${String(i + 1)}`,
			})),
			totalCount: 50,
		},
		loadMoreAction: fn(async () => ({
			success: true as const,
			message: "success",
			data: {
				data: Array.from({ length: 10 }, (_, i) => ({
					id: String(i + 21),
					title: `Item ${String(i + 21)}`,
				})),
				totalCount: 50,
			},
		})),
	},
};
