import { getBrowserBackendClient } from "@/common/backend/browser-client";
// @vitest-environment node
import { uploadImage, uploadBook } from "@/common/backend/upload";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
import { UploadStart } from "@s-hirano-ist/s-api-client/models";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("@/common/backend/browser-client", () => ({
	getBrowserBackendClient: vi.fn(),
}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
const chunkSize = 1048576;
const uploadId = "upload-session";
const operationId = "01933f5c-9df0-7001-9123-456789abcdef";
beforeEach(() => vi.clearAllMocks());
function form(file: File, key = "file") {
	const data = new FormData();
	data.set(key, file);
	return data;
}
function session(id: string, receivedParts: number[] = []) {
	return Response.json({
		uploadId,
		operationId: id,
		chunkSize,
		receivedParts,
		expiresAt: "2099-01-01T00:00:00Z",
	});
}
function completed(id: string, type = "images") {
	return Response.json(
		{ accepted: true, operationId: id, resource: { id: "record", type } },
		{ status: 201 },
	);
}
function fixture(handler: typeof globalThis.fetch) {
	const fetch = vi.fn(handler);
	vi.mocked(getBrowserBackendClient).mockReturnValue(
		createBackendClient({ baseURL: "https://web.example/api/v1", fetch }),
	);
	return fetch;
}
function path(input: RequestInfo | URL) {
	return new URL(input instanceof Request ? input.url : input.toString())
		.pathname;
}
function body(init?: RequestInit) {
	if (typeof init?.body !== "string") throw new Error("Expected JSON request");
	const value: unknown = JSON.parse(init.body);
	return UploadStart.parse(value);
}
function uploadFixture(
	options: {
		failPart?: number;
		loseComplete?: boolean;
		receivedParts?: number[];
	} = {},
) {
	const ids: string[] = [];
	let received = options.receivedParts ?? [];
	let failed = false;
	let completedOnce = false;
	let domain: "images" | "books" = "images";
	const fetch = fixture(async (input, init) => {
		const url = path(input);
		if (url.endsWith("/uploads")) {
			const start = body(init);
			ids.push(start.operationId);
			domain = start.domain;
			return session(start.operationId, received);
		}
		if (url.endsWith("/complete")) {
			received = [];
			if (options.loseComplete && !completedOnce) {
				completedOnce = true;
				throw new TypeError("Lost completion response");
			}
			return completed(ids[0], domain);
		}
		const part = Number(url.split("/").at(-1));
		if (part === options.failPart && !failed) {
			failed = true;
			return Response.json(
				{ error: { code: "API_UNAVAILABLE" } },
				{ status: 503 },
			);
		}
		received = [...received, part];
		return Response.json({ accepted: true, part });
	});
	return { fetch, ids };
}

test("sends files above the server-action limit in serial 1MiB chunks and skips received parts", async () => {
	const file = new File([new Uint8Array(5 * chunkSize + 17)], "large.png", {
		type: "image/png",
	});
	const { fetch } = uploadFixture({ receivedParts: [1] });
	expect(await uploadImage(form(file))).toEqual({
		success: true,
		message: "inserted",
	});
	expect(fetch.mock.calls.map(([input]) => path(input))).toEqual([
		"/api/v1/uploads",
		...[0, 2, 3, 4, 5].map(
			(part) => `/api/v1/uploads/${uploadId}/chunks/${part}`,
		),
		`/api/v1/uploads/${uploadId}/complete`,
	]);
	expect(
		fetch.mock.calls.slice(1, -1).map(([, init]) => blobSize(init?.body)),
	).toEqual([chunkSize, chunkSize, chunkSize, chunkSize, 17]);
});
function blobSize(value: BodyInit | null | undefined) {
	if (!(value instanceof Blob)) throw new Error("Expected Blob chunk");
	return value.size;
}
test("retains a file's operation ID after a failed chunk and resumes without automatic retries", async () => {
	const file = new File([new Uint8Array(chunkSize + 3)], "retry.png", {
		type: "image/png",
	});
	const { fetch, ids } = uploadFixture({ failPart: 1 });
	expect(await uploadImage(form(file))).toEqual({
		success: false,
		message: "unexpected",
	});
	expect(fetch).toHaveBeenCalledTimes(3);
	expect(await uploadImage(form(file))).toEqual({
		success: true,
		message: "inserted",
	});
	expect(ids).toHaveLength(2);
	expect(ids[1]).toBe(ids[0]);
	expect(
		fetch.mock.calls.filter(([input]) => path(input).endsWith("/0")),
	).toHaveLength(1);
});
test("uses the book draft ID and sends typed rating and tag metadata", async () => {
	const data = form(
		new File(["png"], "cover.png", { type: "image/png" }),
		"image",
	);
	for (const [key, value] of Object.entries({
		operationId,
		isbn: "9780306406157",
		title: "Book",
		rating: "4",
		tags: "one, two",
	}))
		data.set(key, value);
	const { fetch } = uploadFixture();
	expect(await uploadBook(data)).toEqual({
		success: true,
		message: "inserted",
	});
	expect(body(fetch.mock.calls[0][1])).toEqual({
		operationId,
		domain: "books",
		contentType: "image/png",
		fileSize: 3,
		metadata: {
			filename: "cover.png",
			isbn: "9780306406157",
			title: "Book",
			rating: 4,
			tags: ["one", "two"],
		},
	});
});
test("rejects oversized or unsupported files before starting a session", async () => {
	const fetch = fixture(async () => {
		throw new Error("Must not fetch");
	});
	expect(
		await uploadImage(
			form(
				new File([new Uint8Array(10 * chunkSize + 1)], "large.png", {
					type: "image/png",
				}),
			),
		),
	).toEqual({ success: false, message: "invalidFormat" });
	expect(
		await uploadImage(
			form(new File(["gif"], "image.gif", { type: "image/gif" })),
		),
	).toEqual({ success: false, message: "invalidFormat" });
	expect(fetch).not.toHaveBeenCalled();
});

test("keeps the operation ID when completion succeeded but its response was lost", async () => {
	const file = new File(["png"], "cover.png", { type: "image/png" });
	const { fetch, ids } = uploadFixture({ loseComplete: true });
	expect(await uploadImage(form(file))).toEqual({
		success: false,
		message: "unexpected",
	});
	expect(fetch).toHaveBeenCalledTimes(3);
	expect(await uploadImage(form(file))).toEqual({
		success: true,
		message: "inserted",
	});
	expect(ids[1]).toBe(ids[0]);
});
