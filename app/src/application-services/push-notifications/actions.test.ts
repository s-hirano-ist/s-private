import {
	subscribeToPush,
	unsubscribeFromPush,
	sendTestPush,
} from "@/application-services/push-notifications/actions";
import { getBackendClient } from "@/common/backend/server-client";
import { createBackendClient } from "@s-hirano-ist/s-api-client";
import { beforeEach, expect, test, vi } from "vite-plus/test";
vi.mock("@/common/backend/server-client", () => ({
	getBackendClient: vi.fn(),
}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
const input = {
	endpoint: "https://push.example/subscription",
	keys: { auth: "auth", p256dh: "key" },
};
beforeEach(() => vi.clearAllMocks());
function fixture(response: Response) {
	const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);
	vi.mocked(getBackendClient).mockResolvedValue(
		createBackendClient({ baseURL: "https://backend.example/api/v1", fetch }),
	);
	return fetch;
}
test("registers using the generated subscription DTO and 204 contract", async () => {
	const fetch = fixture(new Response(null, { status: 204 }));
	expect(await subscribeToPush(input)).toEqual({
		success: true,
		message: "pushSubscribed",
	});
	expect(fetch.mock.calls[0][1]).toMatchObject({
		method: "POST",
		body: JSON.stringify(input),
	});
});
test("unregisters and requests test delivery using endpoint DTOs", async () => {
	const fetch = fixture(new Response(null, { status: 204 }));
	expect(await unsubscribeFromPush(input.endpoint)).toEqual({
		success: true,
		message: "pushUnsubscribed",
	});
	expect(await sendTestPush(input.endpoint)).toEqual({
		success: true,
		message: "pushTestSent",
	});
	expect(
		fetch.mock.calls.map(([, init]) => ({
			method: init?.method,
			body: init?.body,
		})),
	).toEqual([
		{ method: "DELETE", body: JSON.stringify({ endpoint: input.endpoint }) },
		{ method: "POST", body: JSON.stringify({ endpoint: input.endpoint }) },
	]);
});
test("preserves backend ownership errors and unavailable configuration", async () => {
	const fetch = fixture(
		Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
	);
	expect(await subscribeToPush(input)).toEqual({
		success: false,
		message: "notAllowed",
	});
	fetch.mockResolvedValue(
		Response.json({ error: { code: "API_UNAVAILABLE" } }, { status: 503 }),
	);
	expect(await subscribeToPush(input)).toEqual({
		success: false,
		message: "unexpected",
	});
});
test("does not treat malformed delivery responses as success", async () => {
	fixture(Response.json({}, { status: 200 }));
	expect(await sendTestPush(input.endpoint)).toEqual({
		success: false,
		message: "unexpected",
	});
});

test("validates browser subscription JSON before sending it", async () => {
	const fetch = fixture(new Response(null, { status: 204 }));
	expect(
		await subscribeToPush({ ...input, keys: { auth: "", p256dh: "key" } }),
	).toEqual({ success: false, message: "invalidFormat" });
	expect(fetch).not.toHaveBeenCalled();
});
