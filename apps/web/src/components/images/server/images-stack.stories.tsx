import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ImagesStack } from "./images-stack";

const images = [1, 2, 3, 4].map((id) => ({
	id: String(id),
	originalPath: `https://picsum.photos/id/${id}/600/600`,
	thumbnailPath: `https://picsum.photos/id/${id}/192/192`,
	height: 600,
	width: 600,
}));

const meta = {
	component: ImagesStack,
	parameters: { layout: "padded" },
} satisfies Meta<typeof ImagesStack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		initialData: { data: images, totalCount: 8 },
		loadMoreAction: async () => ({
			success: true,
			message: "success",
			data: {
				data: images.map((image) => ({ ...image, id: `more-${image.id}` })),
				totalCount: 8,
			},
		}),
		deleteAction: async () => ({ success: true, message: "Image deleted" }),
	},
};

export const Viewer: Story = {
	args: { ...Default.args },
};

export const Empty: Story = {
	args: { ...Default.args, initialData: { data: [], totalCount: 0 } },
};

export const AllLoaded: Story = {
	args: {
		...Default.args,
		initialData: { data: images, totalCount: images.length },
	},
};

export const ExportedWithDelete: Story = {
	args: {
		...Default.args,
		deleteAction: fn().mockResolvedValue({ success: true, message: "deleted" }),
	},
	play: async ({ args, canvas }) => {
		await userEvent.click(canvas.getAllByRole("button", { name: "削除" })[0]);
		const body = within(document.body);
		await expect(body.getByRole("dialog")).toBeInTheDocument();
		await userEvent.click(body.getByRole("button", { name: "キャンセル" }));
		await expect(args.deleteAction).not.toHaveBeenCalled();
		await userEvent.click(canvas.getAllByRole("button", { name: "削除" })[0]);
		await userEvent.click(body.getByRole("button", { name: "削除" }));
		await expect(args.deleteAction).toHaveBeenCalledTimes(1);
		await expect(args.deleteAction).toHaveBeenCalledWith("1");
	},
};
