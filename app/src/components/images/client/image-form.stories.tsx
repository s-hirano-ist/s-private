import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getBrowserBackendClient } from "@/common/backend/browser-client";
import { uploadImage } from "@/common/backend/upload";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
import { UploadStart } from "@s-hirano-ist/s-api-client/models";
import {
	expect,
	fireEvent,
	fn,
	mocked,
	userEvent,
	waitFor,
	within,
} from "storybook/test";
import { ImageForm } from "./image-form";

const meta = {
	component: ImageForm,
	parameters: { layout: "centered" },
} satisfies Meta<typeof ImageForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { addImage: fn() },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.getByText("画像")).toBeInTheDocument();
		await expect(
			canvas.getByRole("button", { name: "アップロード" }),
		).toBeInTheDocument();

		const fileInput = canvas.getByLabelText("画像");
		await expect(fileInput).toBeRequired();
	},
};

const chunkSize = 1048576;
let uploadFetch = fn<typeof globalThis.fetch>();
function prepareUploadClient() {
	let operationId = "";
	uploadFetch = fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(
			input instanceof Request ? input.url : input.toString(),
		);
		if (url.pathname.endsWith("/uploads")) {
			if (typeof init?.body !== "string")
				throw new Error("Expected JSON input");
			const value: unknown = JSON.parse(init.body);
			operationId = UploadStart.parse(value).operationId;
			return Response.json({
				uploadId: "story-upload",
				operationId,
				chunkSize,
				receivedParts: [],
				expiresAt: "2099-01-01T00:00:00Z",
			});
		}
		if (url.pathname.endsWith("/complete"))
			return Response.json(
				{
					accepted: true,
					operationId,
					resource: { id: "story-image", type: "images" },
				},
				{ status: 201 },
			);
		return Response.json({
			accepted: true,
			part: Number(url.pathname.split("/").at(-1)),
		});
	});
	mocked(getBrowserBackendClient).mockReturnValue(
		createBackendClient({
			baseURL: "https://storybook.example/api/v1",
			fetch: uploadFetch,
		}),
	);
	return () => mocked(getBrowserBackendClient).mockReset();
}
function chunkSizes() {
	return uploadFetch.mock.calls.slice(1, -1).map(([, init]) => {
		if (!(init?.body instanceof Blob)) throw new Error("Expected binary chunk");
		return init.body.size;
	});
}
export const LargeImageChunks: Story = {
	args: { addImage: uploadImage },
	beforeEach: prepareUploadClient,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const file = new File([new Uint8Array(5 * chunkSize + 17)], "large.png", {
			type: "image/png",
		});
		await userEvent.upload(canvas.getByLabelText("画像"), file);
		submitFileForm(canvas.getByRole("button", { name: "アップロード" }));
		await waitFor(() => expect(getBrowserBackendClient).toHaveBeenCalled());
		await waitFor(() => expect(uploadFetch).toHaveBeenCalledTimes(8));
		await expect(canvas.findByLabelText("画像")).resolves.toHaveValue("");
		await expect(chunkSizes()).toEqual([
			chunkSize,
			chunkSize,
			chunkSize,
			chunkSize,
			chunkSize,
			17,
		]);
	},
};

function submitFileForm(button: HTMLElement) {
	const form = button.closest("form");
	if (!form) throw new Error("Missing image form");
	// userEvent uploads a synthetic FileList; dispatch submit as in the existing cover stories.
	fireEvent.submit(form);
}
