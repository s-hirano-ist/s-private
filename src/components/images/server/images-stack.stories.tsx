import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { ImagesStack } from "./images-stack";

type ImageData = {
	id?: string;
	originalPath: string;
	thumbnailPath: string;
	height?: number | null;
	width?: number | null;
};

type ImagesStackWrapperProps = {
	currentPage: number;
	getImages: (page: number) => Promise<ImageData[]>;
	deleteImages?: (id: string) => Promise<{ success: boolean; message: string }>;
};

function ImagesStackWrapper({
	currentPage,
	getImages,
	deleteImages,
}: ImagesStackWrapperProps) {
	return (
		<Suspense>
			<ImagesStack
				currentPage={currentPage}
				deleteImages={deleteImages}
				getImages={getImages}
			/>
		</Suspense>
	);
}

const meta = {
	component: ImagesStackWrapper,
	parameters: { layout: "padded" },
	tags: ["autodocs"],
	argTypes: {
		currentPage: { control: { type: "number", min: 1 } },
		getImages: { action: "getImages" },
		deleteImages: { action: "deleteImages" },
	},
} satisfies Meta<typeof ImagesStackWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockImageData: ImageData[] = [
	{
		id: "1",
		originalPath: "https://picsum.photos/id/1/192/192",
		thumbnailPath: "https://picsum.photos/id/1/192/192",
		height: 600,
		width: 800,
	},
	{
		id: "2",
		originalPath: "https://picsum.photos/id/2/192/192",
		thumbnailPath: "https://picsum.photos/id/2/192/192",
		height: 900,
		width: 1200,
	},
	{
		id: "3",
		originalPath: "https://picsum.photos/id/3/192/192",
		thumbnailPath: "https://picsum.photos/id/3/192/192",
		height: 800,
		width: 600,
	},
	{
		id: "4",
		originalPath: "https://picsum.photos/id/4/192/192",
		thumbnailPath: "https://picsum.photos/id/4/192/192",
		height: 750,
		width: 1000,
	},
];

export const Default: Story = {
	args: {
		currentPage: 1,
		getImages: async () => mockImageData,
		deleteImages: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		currentPage: 1,
		getImages: async () => mockImageData,
	},
};

export const Empty: Story = {
	args: {
		currentPage: 1,
		getImages: async () => [],
		deleteImages: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const SingleImage: Story = {
	args: {
		currentPage: 1,
		getImages: async () => [mockImageData[0]],
		deleteImages: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const WithoutDimensions: Story = {
	args: {
		currentPage: 1,
		getImages: async () => [
			{
				id: "1",
				originalPath: "https://picsum.photos/id/1/192/192",
				thumbnailPath: "https://picsum.photos/id/1/192/192",
			},
		],
		deleteImages: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const MixedFormats: Story = {
	args: {
		currentPage: 1,
		getImages: async () => [
			...mockImageData,
			{
				id: "5",
				originalPath: "https://picsum.photos/id/5/192/192",
				thumbnailPath: "https://picsum.photos/id/5/192/192",
				height: 300,
				width: 400,
			},
			{
				id: "6",
				originalPath: "https://picsum.photos/id/6/192/192",
				thumbnailPath: "https://picsum.photos/id/6/192/192",
				height: 1080,
				width: 1920,
			},
		],
		deleteImages: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 2,
		getImages: async (page) => {
			if (page === 2) {
				return [
					{
						id: "7",
						originalPath: "https://picsum.photos/id/7/192/192",
						thumbnailPath: "https://picsum.photos/id/7/192/192",
						height: 400,
						width: 600,
					},
				];
			}
			return mockImageData;
		},
		deleteImages: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const DeleteError: Story = {
	args: {
		currentPage: 1,
		getImages: async () => mockImageData,
		deleteImages: async () => ({
			success: false,
			message: "Failed to delete image",
		}),
	},
};
