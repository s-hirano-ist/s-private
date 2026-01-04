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
	totalCount: number;
	getImages: (page: number) => Promise<ImageData[]>;
	deleteImage?: (id: string) => Promise<{ success: boolean; message: string }>;
};

function ImagesStackWrapper({
	currentPage,
	totalCount,
	getImages,
	deleteImage,
}: ImagesStackWrapperProps) {
	return (
		<Suspense>
			<ImagesStack
				currentPage={currentPage}
				deleteImage={deleteImage}
				getImages={getImages}
				totalCount={totalCount}
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
		totalCount: { control: { type: "number", min: 0 } },
		getImages: { action: "getImages" },
		deleteImage: { action: "deleteImage" },
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
		totalCount: 100,
		getImages: async () => mockImageData,
		deleteImage: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const WithoutDeleteAction: Story = {
	args: {
		currentPage: 1,
		totalCount: 50,
		getImages: async () => mockImageData,
	},
};

export const Empty: Story = {
	args: {
		currentPage: 1,
		totalCount: 0,
		getImages: async () => [],
		deleteImage: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const SingleImage: Story = {
	args: {
		currentPage: 1,
		totalCount: 1,
		getImages: async () => [mockImageData[0]],
		deleteImage: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const WithoutDimensions: Story = {
	args: {
		currentPage: 1,
		totalCount: 1,
		getImages: async () => [
			{
				id: "1",
				originalPath: "https://picsum.photos/id/1/192/192",
				thumbnailPath: "https://picsum.photos/id/1/192/192",
			},
		],
		deleteImage: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const MixedFormats: Story = {
	args: {
		currentPage: 1,
		totalCount: 6,
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
		deleteImage: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 2,
		totalCount: 50,
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
		deleteImage: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const DeleteError: Story = {
	args: {
		currentPage: 1,
		totalCount: 100,
		getImages: async () => mockImageData,
		deleteImage: async () => ({
			success: false,
			message: "Failed to delete image",
		}),
	},
};

export const WithPagination: Story = {
	args: {
		currentPage: 3,
		totalCount: 120,
		getImages: async () => mockImageData,
		deleteImage: async () => ({
			success: true,
			message: "Image deleted successfully",
		}),
	},
};

export const NoPagination: Story = {
	args: {
		currentPage: 1,
		totalCount: 20,
		getImages: async () => mockImageData,
	},
};
