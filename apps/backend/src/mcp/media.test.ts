import { readMediaPage } from "s-private-backend/mcp/media";
import { expect, test, vi } from "vite-plus/test";

function segmentedResponse() {
	const segments = ["ab", "c", "def"].map((value) => Buffer.from(value));
	return new Response(
		new ReadableStream({
			pull(controller) {
				const segment = segments.shift();
				if (segment) controller.enqueue(segment);
				else controller.close();
			},
		}),
		{ headers: { "content-type": "image/png" } },
	);
}

test.each([
	{ offset: 0, length: 3, data: "abc", nextOffset: 3 },
	{ offset: 2, length: 3, data: "cde", nextOffset: 5 },
	{ offset: 3, length: 3, data: "def", nextOffset: null },
	{ offset: 5, length: 3, data: "f", nextOffset: null },
	{ offset: 6, length: 3, data: "", nextOffset: null },
	{ offset: 100, length: 3, data: "", nextOffset: null },
])(
	"reads across stream boundaries: $offset/$length",
	async ({ offset, length, data, nextOffset }) => {
		const response = segmentedResponse();
		expect(await readMediaPage(response, offset, length)).toEqual({
			data: Buffer.from(data).toString("base64"),
			mimeType: "image/png",
			offset,
			byteLength: data.length,
			nextOffset,
		});
	},
);

test("stops reading after one lookahead byte and cancels the source", async () => {
	const cancel = vi.fn();
	const pull = vi.fn(
		(controller: ReadableStreamDefaultController<Uint8Array>) =>
			controller.enqueue(Buffer.alloc(1024)),
	);
	const response = new Response(new ReadableStream({ pull, cancel }), {
		headers: { "content-type": "image/webp" },
	});
	expect(await readMediaPage(response, 0, 10)).toMatchObject({
		byteLength: 10,
		nextOffset: 10,
	});
	expect(pull.mock.calls.length).toBeLessThanOrEqual(2);
	expect(cancel).toHaveBeenCalledTimes(1);
	expect(response.body?.locked).toBe(false);
});

test("cancels invalid content and releases a failed stream", async () => {
	const cancel = vi.fn();
	const response = new Response(new ReadableStream({ cancel }), {
		headers: { "content-type": "text/html" },
	});
	await expect(readMediaPage(response, 0, 10)).rejects.toThrow(
		"INTERNAL_ERROR",
	);
	expect(cancel).toHaveBeenCalledTimes(1);
	const failed = new Response(
		new ReadableStream({
			pull() {
				throw new Error("storage failure");
			},
		}),
		{ headers: { "content-type": "image/png" } },
	);
	await expect(readMediaPage(failed, 0, 10)).rejects.toThrow("storage failure");
	expect(failed.body?.locked).toBe(false);
});
