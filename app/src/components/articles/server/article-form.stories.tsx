import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleForm } from "./article-form";

type ArticleFormWrapperProps = {
	addArticle: (
		formData: FormData,
	) => Promise<{ success: boolean; message: string }>;
	categories: Array<{ id: string; name: string }>;
};

function ArticleFormWrapper({
	addArticle,
	categories,
}: ArticleFormWrapperProps) {
	return <ArticleForm addArticle={addArticle} categories={categories} />;
}

const meta = {
	component: ArticleFormWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		addArticle: { action: "addArticle" },
	},
} satisfies Meta<typeof ArticleFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addArticle: async () => ({
			success: true,
			message: "articles added successfully",
		}),
		categories: [
			{ id: "1", name: "Technology" },
			{ id: "2", name: "Science" },
			{ id: "3", name: "Business" },
		],
	},
};

export const WithManyCategories: Story = {
	args: {
		addArticle: async () => ({
			success: true,
			message: "articles added successfully",
		}),
		categories: [
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
		addArticle: async () => ({
			success: true,
			message: "articles added successfully",
		}),
		categories: [],
	},
};

export const ErrorOnSubmit: Story = {
	args: {
		addArticle: async () => ({
			success: false,
			message: "Failed to add articles",
		}),
		categories: [
			{ id: "1", name: "Technology" },
			{ id: "2", name: "Science" },
		],
	},
};
