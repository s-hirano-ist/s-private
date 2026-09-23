import { describe, expect, test, vi } from "vitest";
import { tenantContext } from "./tenant-context";

describe("tenantContext", () => {
	test("returns undefined when no scope is active", () => {
		expect(tenantContext.getStore()).toBeUndefined();
	});

	test("exposes the store inside run()", () => {
		const store = tenantContext.run({ userId: "user-a" }, () =>
			tenantContext.getStore(),
		);

		expect(store).toEqual({ userId: "user-a" });
	});

	test("propagates the store across async boundaries", async () => {
		const userId = await tenantContext.run({ userId: "user-b" }, async () => {
			await Promise.resolve();
			return tenantContext.getStore()?.userId;
		});

		expect(userId).toBe("user-b");
	});

	test("does not leak the store outside run()", () => {
		tenantContext.run({ userId: "user-a" }, () => undefined);

		expect(tenantContext.getStore()).toBeUndefined();
	});

	test("reuses its instance when the module is re-evaluated", async () => {
		vi.resetModules();
		const { tenantContext: reloadedTenantContext } =
			await import("./tenant-context");

		expect(reloadedTenantContext).toBe(tenantContext);
	});
});
