import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { NewsForm } from "./news-form";

type NewsFormWrapperProps = {
	addNews: (
		formData: FormData,
	) => Promise<{ success: boolean; message: string }>;
	getCategories: () => Promise<Array<{ id: string; name: string }>>;
};

function NewsFormWrapper({ addNews, getCategories }: NewsFormWrapperProps) {
	return (
		<Suspense>
			<NewsForm addNews={addNews} getCategories={getCategories} />
		</Suspense>
	);
}

const meta = {
	component: NewsFormWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		addNews: { action: "addNews" },
		getCategories: { action: "getCategories" },
	},
} satisfies Meta<typeof NewsFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addNews: async () => ({
			success: true,
			message: "News added successfully",
		}),
		getCategories: async () => [
			{ id: "1", name: "Technology" },
			{ id: "2", name: "Science" },
			{ id: "3", name: "Business" },
		],
	},
};

export const WithManyCategories: Story = {
	args: {
		addNews: async () => ({
			success: true,
			message: "News added successfully",
		}),
		getCategories: async () => [
			{ id: "1", name: "Technology" },
			{ id: "2", name: "Science" },
			{ id: "3", name: "Business" },
			{ id: "4", name: "Entertainment" },
			{ id: "5", name: "Sports" },
			{ id: "6", name: "Health" },
			{ id: "7", name: "Education" },
		],
	},
};

export const EmptyCategories: Story = {
	args: {
		addNews: async () => ({
			success: true,
			message: "News added successfully",
		}),
		getCategories: async () => [],
	},
};

export const ErrorOnSubmit: Story = {
	args: {
		addNews: async () => ({
			success: false,
			message: "Failed to add news",
		}),
		getCategories: async () => [
			{ id: "1", name: "Technology" },
			{ id: "2", name: "Science" },
		],
	},
};
