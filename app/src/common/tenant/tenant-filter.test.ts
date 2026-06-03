import type { TenantStore } from "./tenant-context";
import { describe, expect, test } from "vitest";
import { applyTenantFilter } from "./tenant-filter";

const STORE: TenantStore = { userId: "user-a" };

describe("applyTenantFilter", () => {
	describe("reads (fail-open)", () => {
		test.each([
			"findMany",
			"findFirst",
			"findFirstOrThrow",
			"count",
			"aggregate",
			"groupBy",
		])(
			"AND-injects userId into where for %s when scope is set",
			(operation) => {
				const result = applyTenantFilter(
					"Article",
					operation,
					{ where: { status: "EXPORTED" } },
					STORE,
				);

				expect(result).toEqual({
					where: { AND: [{ status: "EXPORTED" }, { userId: "user-a" }] },
				});
			},
		);

		test("handles missing where by AND-ing an empty object", () => {
			const result = applyTenantFilter("Article", "findMany", {}, STORE);

			expect(result).toEqual({ where: { AND: [{}, { userId: "user-a" }] } });
		});

		test("handles undefined args (e.g. count())", () => {
			const result = applyTenantFilter("Article", "count", undefined, STORE);

			expect(result).toEqual({ where: { AND: [{}, { userId: "user-a" }] } });
		});

		test("passes reads through unchanged when no scope is set", () => {
			const args = { where: { status: "EXPORTED" } };
			const result = applyTenantFilter("Article", "findMany", args, undefined);

			expect(result).toBe(args);
			expect(result).toEqual({ where: { status: "EXPORTED" } });
		});
	});

	describe("findUnique (never rewritten)", () => {
		test.each(["findUnique", "findUniqueOrThrow"])(
			"passes %s through unchanged even with a scope",
			(operation) => {
				const args = { where: { url_userId: { url: "u", userId: "user-a" } } };
				const result = applyTenantFilter("Article", operation, args, STORE);

				expect(result).toBe(args);
			},
		);

		test("does not throw for findUnique without a scope (it is a read)", () => {
			const args = { where: { url_userId: { url: "u", userId: "user-a" } } };
			expect(applyTenantFilter("Article", "findUnique", args, undefined)).toBe(
				args,
			);
		});
	});

	describe("mutations (fail-closed)", () => {
		test.each([
			"create",
			"createMany",
			"update",
			"updateMany",
			"delete",
			"deleteMany",
			"upsert",
		])("throws for %s when no scope is set", (operation) => {
			expect(() =>
				applyTenantFilter("Article", operation, { data: {} }, undefined),
			).toThrow(/Tenant context is required/u);
		});

		test("stamps userId onto create data", () => {
			const result = applyTenantFilter(
				"Article",
				"create",
				{ data: { title: "t" } },
				STORE,
			);

			expect(result).toEqual({ data: { title: "t", userId: "user-a" } });
		});

		test("overrides a caller-supplied userId on create", () => {
			const result = applyTenantFilter(
				"Article",
				"create",
				{ data: { title: "t", userId: "user-b" } },
				STORE,
			);

			expect(result).toEqual({ data: { title: "t", userId: "user-a" } });
		});

		test("stamps userId onto every row of createMany", () => {
			const result = applyTenantFilter(
				"Article",
				"createMany",
				{ data: [{ title: "a" }, { title: "b" }] },
				STORE,
			);

			expect(result).toEqual({
				data: [
					{ title: "a", userId: "user-a" },
					{ title: "b", userId: "user-a" },
				],
			});
		});

		test.each(["updateMany", "deleteMany"])(
			"AND-injects userId into where for %s",
			(operation) => {
				const result = applyTenantFilter(
					"Article",
					operation,
					{ where: { status: "UNEXPORTED" } },
					STORE,
				);

				expect(result).toEqual({
					where: { AND: [{ status: "UNEXPORTED" }, { userId: "user-a" }] },
				});
			},
		);

		test.each(["update", "delete"])(
			"merges userId as a flat field (keeps unique selector) for %s",
			(operation) => {
				const result = applyTenantFilter(
					"Article",
					operation,
					{ where: { id: "id-1", status: "UNEXPORTED" } },
					STORE,
				);

				expect(result).toEqual({
					where: { id: "id-1", status: "UNEXPORTED", userId: "user-a" },
				});
			},
		);

		test("overrides a caller-supplied userId on delete where", () => {
			const result = applyTenantFilter(
				"Article",
				"delete",
				{ where: { id: "id-1", userId: "user-b" } },
				STORE,
			);

			expect(result).toEqual({ where: { id: "id-1", userId: "user-a" } });
		});

		test("stamps create payload and merges where for upsert", () => {
			const result = applyTenantFilter(
				"Article",
				"upsert",
				{ where: { id: "id-1" }, create: { title: "t" }, update: {} },
				STORE,
			);

			expect(result).toEqual({
				where: { id: "id-1", userId: "user-a" },
				create: { title: "t", userId: "user-a" },
				update: {},
			});
		});
	});

	describe("system bypass", () => {
		test.each(["findMany", "create", "delete", "updateMany"])(
			"passes %s through unchanged for system operations",
			(operation) => {
				const args = { where: { id: "id-1" }, data: { title: "t" } };
				const result = applyTenantFilter("Article", operation, args, {
					userId: "user-a",
					system: true,
				});

				expect(result).toBe(args);
			},
		);
	});
});
