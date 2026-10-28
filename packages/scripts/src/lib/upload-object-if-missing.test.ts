import { expect, test, vi } from "vite-plus/test";
import { uploadObjectIfMissing } from "./upload-object-if-missing.js";

function setup() {
	return {
		statObject: vi.fn().mockResolvedValue({}),
		putObject: vi.fn().mockResolvedValue({}),
	};
}
test("keeps existing objects and uploads only missing keys", async () => {
	const client = setup();
	const bytes = Buffer.from("image");
	await uploadObjectIfMissing(client, "bucket", "images/a", bytes);
	expect(client.putObject).not.toHaveBeenCalled();
	client.statObject.mockRejectedValue({
		name: "NotFound",
		$metadata: { httpStatusCode: 404 },
	});
	await uploadObjectIfMissing(client, "bucket", "images/a", bytes);
	expect(client.putObject).toHaveBeenCalledWith("bucket", "images/a", bytes);
});
test.each([
	new Error("network failure"),
	{ name: "AccessDenied", $metadata: { httpStatusCode: 403 } },
	{ name: "NoSuchBucket", $metadata: { httpStatusCode: 404 } },
])("does not write after a non-key error %s", async (error) => {
	const client = setup();
	client.statObject.mockRejectedValue(error);
	await expect(
		uploadObjectIfMissing(client, "bucket", "images/a", Buffer.from("image")),
	).rejects.toBe(error);
	expect(client.putObject).not.toHaveBeenCalled();
});
test("dry-run performs no storage reads or writes", async () => {
	const client = setup();
	await uploadObjectIfMissing(
		client,
		"bucket",
		"images/a",
		Buffer.from("image"),
		true,
	);
	expect(client.statObject).not.toHaveBeenCalled();
	expect(client.putObject).not.toHaveBeenCalled();
});
