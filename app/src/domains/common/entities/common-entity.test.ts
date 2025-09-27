import { describe, expect, test } from "vitest";
import {
	makeCreatedAt,
	makeExportedAt,
} from "@/domains/common/entities/common-entity";

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
});
