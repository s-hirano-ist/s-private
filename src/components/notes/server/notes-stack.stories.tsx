import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { NotesStack, type Props as NotesStackProps } from "./notes-stack";

function NotesStackWrapper({
	getNotes,
	deleteNote,
	loadMoreAction,
}: NotesStackProps) {
	return (
		<Suspense>
			<NotesStack
				deleteNote={deleteNote}
				getNotes={getNotes}
				loadMoreAction={loadMoreAction}
			/>
		</Suspense>
	);
}

const meta = {
	component: NotesStackWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		getNotes: { action: "getNotes" },
		deleteNote: { action: "deleteNote" },
		loadMoreAction: { action: "loadMoreAction" },
	},
} satisfies Meta<typeof NotesStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockGetNotes = async () => ({
	data: [
		{
			id: "1",
			key: "note-guide-1",
			title: "Getting Started with TypeScript",
			description:
				"A comprehensive guide to getting started with TypeScript for beginners. Learn the basics of type annotations, interfaces, and more.",
			primaryBadgeText: "Guide",
			secondaryBadgeText: "TypeScript",
			href: "/note/getting-started-typescript",
		},
		{
			id: "2",
			key: "note-tutorial-2",
			title: "Advanced React Patterns",
			description:
				"Explore advanced React patterns including render props, higher-order components, and custom hooks.",
			primaryBadgeText: "Tutorial",
			secondaryBadgeText: "React",
			href: "/note/advanced-react-patterns",
		},
		{
			id: "3",
			key: "note-reference-3",
			title: "JavaScript ES2024 Features",
			description:
				"Overview of the latest JavaScript features introduced in ES2024.",
			primaryBadgeText: "Reference",
			href: "/note/javascript-es2024-features",
		},
		{
			id: "4",
			key: "note-cheatsheet-4",
			title: "CSS Grid Cheat Sheet",
			description: "Quick reference for CSS Grid layout properties and values.",
			primaryBadgeText: "Cheat Sheet",
			secondaryBadgeText: "CSS",
			href: "/note/css-grid-cheatsheet",
		},
	],
	totalCount: 100,
});

const mockLoadMoreAction = async () => ({
	success: true,
	message: "success",
	data: {
		data: [],
		totalCount: 100,
	},
});

export const Default: Story = {
	args: {
		getNotes: mockGetNotes,
		deleteNote: async () => ({
			success: true,
			message: "Note deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		getNotes: mockGetNotes,
		loadMoreAction: mockLoadMoreAction,
	},
};

export const Empty: Story = {
	args: {
		getNotes: mockGetNotes,
		deleteNote: async () => ({
			success: true,
			message: "Note deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const SingleItem: Story = {
	args: {
		getNotes: mockGetNotes,
		deleteNote: async () => ({
			success: true,
			message: "Note deleted successfully",
		}),
		loadMoreAction: mockLoadMoreAction,
	},
};

export const WithInfiniteScroll: Story = {
	args: {
		getNotes: mockGetNotes,
		deleteNote: async () => ({
			success: true,
			message: "Note deleted successfully",
		}),
		loadMoreAction: async () => ({
			success: true,
			message: "success",
			data: {
				data: [
					{
						id: "5",
						key: `loaded-note-5-${Date.now()}`,
						title: "Loaded Note Item",
						description: "This was loaded via infinite scroll",
						primaryBadgeText: "Loaded",
						href: "/note/loaded-item",
					},
				],
				totalCount: 100,
			},
		}),
	},
};
