import { describe, expect, test } from "vitest";
import {
	makeCreatedAt,
	makeExportedAt,
	makeUpdatedAt,
} from "./common-entity.ts";

describe("common-entity", () => {
	describe("makeCreatedAt", () => {
		test("should create valid createdAt with current date", () => {
			const before = new Date();
			const createdAt = makeCreatedAt();
			const after = new Date();

			expect(createdAt).toBeInstanceOf(Date);
			expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe("makeExportedAt", () => {
		test("should create valid exportedAt with current date", () => {
			const before = new Date();
			const exportedAt = makeExportedAt();
			const after = new Date();

			expect(exportedAt).toBeInstanceOf(Date);
			expect(exportedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(exportedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe("makeUpdatedAt", () => {
		test("should create valid updatedAt with current date", () => {
			const before = new Date();
			const updatedAt = makeUpdatedAt();
			const after = new Date();

			expect(updatedAt).toBeInstanceOf(Date);
			expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});
});
