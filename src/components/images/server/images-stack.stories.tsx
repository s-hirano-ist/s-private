import type { Meta, StoryObj } from "@storybook/react";
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
		<Suspense fallback={<div>Loading...</div>}>
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
		originalPath:
			"https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Image+1",
		thumbnailPath:
			"https://via.placeholder.com/200x150/FF6B6B/FFFFFF?text=Thumb+1",
		height: 600,
		width: 800,
	},
	{
		id: "2",
		originalPath:
			"https://via.placeholder.com/1200x900/4ECDC4/FFFFFF?text=Image+2",
		thumbnailPath:
			"https://via.placeholder.com/200x150/4ECDC4/FFFFFF?text=Thumb+2",
		height: 900,
		width: 1200,
	},
	{
		id: "3",
		originalPath:
			"https://via.placeholder.com/600x800/45B7D1/FFFFFF?text=Image+3",
		thumbnailPath:
			"https://via.placeholder.com/200x150/45B7D1/FFFFFF?text=Thumb+3",
		height: 800,
		width: 600,
	},
	{
		id: "4",
		originalPath:
			"https://via.placeholder.com/1000x750/F7DC6F/000000?text=Image+4",
		thumbnailPath:
			"https://via.placeholder.com/200x150/F7DC6F/000000?text=Thumb+4",
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
				originalPath:
					"https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=No+Dimensions",
				thumbnailPath:
					"https://via.placeholder.com/200x150/FF6B6B/FFFFFF?text=No+Dims",
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
				originalPath:
					"https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Small+Image",
				thumbnailPath:
					"https://via.placeholder.com/200x150/E74C3C/FFFFFF?text=Small",
				height: 300,
				width: 400,
			},
			{
				id: "6",
				originalPath:
					"https://via.placeholder.com/1920x1080/9B59B6/FFFFFF?text=Large+Image",
				thumbnailPath:
					"https://via.placeholder.com/200x150/9B59B6/FFFFFF?text=Large",
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
						originalPath:
							"https://via.placeholder.com/600x400/8E44AD/FFFFFF?text=Page+2+Image",
						thumbnailPath:
							"https://via.placeholder.com/200x150/8E44AD/FFFFFF?text=P2",
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
