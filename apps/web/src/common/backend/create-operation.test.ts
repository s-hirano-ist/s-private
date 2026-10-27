// @vitest-environment node
import { assignCreateOperation } from "@/common/backend/create-operation";
import { expect, test } from "vite-plus/test";
function draft(title: string, file?: File) {
	const form = new FormData();
	form.set("title", title);
	if (file) form.set("image", file);
	return form;
}
test("retains the operation ID across a failed draft and rotates after editing", async () => {
	const first = draft("one");
	await assignCreateOperation(first);
	const retry = draft("one");
	await assignCreateOperation(retry, first);
	expect(retry.get("operationId")).toBe(first.get("operationId"));
	const changed = draft("two");
	await assignCreateOperation(changed, retry);
	expect(changed.get("operationId")).not.toBe(first.get("operationId"));
});
test("compares file contents, including different files with identical name and size", async () => {
	const first = draft(
		"one",
		new File(["abc"], "same.png", { type: "image/png" }),
	);
	await assignCreateOperation(first);
	const retry = draft(
		"one",
		new File(["abc"], "same.png", { type: "image/png" }),
	);
	await assignCreateOperation(retry, first);
	expect(retry.get("operationId")).toBe(first.get("operationId"));
	const changed = draft(
		"one",
		new File(["xyz"], "same.png", { type: "image/png" }),
	);
	await assignCreateOperation(changed, first);
	expect(changed.get("operationId")).not.toBe(first.get("operationId"));
});
test("does not include transport metadata in the input fingerprint", async () => {
	const first = draft("one");
	await assignCreateOperation(first);
	first.set("uploadId", "resumable-session");
	const retry = draft("one");
	await assignCreateOperation(retry, first);
	expect(retry.get("operationId")).toBe(first.get("operationId"));
});
