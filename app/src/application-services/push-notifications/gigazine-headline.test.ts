import { describe, expect, test } from "vitest";
import { buildGigazineHeadline } from "./gigazine-headline";

describe("buildGigazineHeadline", () => {
	test.each([
		["2026-09-20T00:00:00.000Z", "20260918"],
		["2026-03-01T00:00:00.000Z", "20260227"],
		["2026-01-01T00:00:00.000Z", "20251230"],
	])(
		"uses the Tokyo calendar and subtracts two days from %s",
		(now, expected) => {
			const result = buildGigazineHeadline(new Date(now));
			expect(result.date).toBe(expected);
			expect(result.payload).toMatchObject({
				tag: `gigazine-headline-${expected}`,
				title: `Gigazine news for ${expected}`,
				url: `https://gigazine.net/news/${expected}-headline`,
			});
		},
	);

	test("uses the next Tokyo day before subtracting near midnight UTC", () => {
		expect(
			buildGigazineHeadline(new Date("2026-09-19T16:00:00.000Z")).date,
		).toBe("20260918");
	});
});
