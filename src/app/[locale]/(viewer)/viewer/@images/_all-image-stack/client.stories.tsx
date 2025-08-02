import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AllImageStackClient } from "./client";

const meta = {
	component: AllImageStackClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof AllImageStackClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		images: [
			{
				id: "1",
				width: 1920,
				height: 1080,
			},
			{
				id: "2",
				width: 1280,
				height: 720,
			},
			{
				id: "3",
				width: 800,
				height: 600,
			},
			{
				id: "4",
				width: 1440,
				height: 900,
			},
		],
	},
};

export const EmptyImages: Story = {
	args: {
		images: [],
	},
};

export const SingleImage: Story = {
	args: {
		images: [
			{
				id: "1",
				width: 1920,
				height: 1080,
			},
		],
	},
};

export const VariousSizes: Story = {
	args: {
		images: [
			{
				id: "1",
				width: 1920,
				height: 1080,
			},
			{
				id: "2",
				width: 640,
				height: 480,
			},
			{
				id: "3",
				width: 2560,
				height: 1440,
			},
			{
				id: "4",
				width: 1024,
				height: 768,
			},
			{
				id: "5",
				width: 3840,
				height: 2160,
			},
		],
	},
};

export const WithNullDimensions: Story = {
	args: {
		images: [
			{
				id: "1",
				width: null,
				height: null,
			},
			{
				id: "2",
				width: 1280,
				height: null,
			},
			{
				id: "3",
				width: null,
				height: 720,
			},
			{
				id: "4",
				width: 1920,
				height: 1080,
			},
		],
	},
};
