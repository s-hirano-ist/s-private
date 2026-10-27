import {
	parseReadModel,
	parseStoredSnapshot,
	toDto,
	toSnapshot,
} from "s-private-backend/api/read-models";
import { expect, test } from "vitest";
import { ZodError } from "zod";

const base = {
	id: "record",
	status: "UNEXPORTED",
	createdAt: new Date("2026-10-01T01:02:03Z"),
	updatedAt: new Date("2026-10-02T01:02:03Z"),
	exportedAt: null,
	userId: "private-owner",
};
test.each([
	[
		"articles",
		{
			...base,
			title: "Article",
			url: "https://example.com",
			quote: null,
			categoryId: "category",
			categoryName: "Tech",
		},
	],
	["notes", { ...base, title: "Note", markdown: "Body" }],
	[
		"images",
		{
			...base,
			path: "image.png",
			contentType: "image/png",
			fileSize: 1,
			width: null,
			height: null,
		},
	],
	[
		"books",
		{
			...base,
			isbn: "9780306406157",
			title: "Book",
			markdown: null,
			imagePath: null,
			rating: 3,
			tags: [],
		},
	],
] as const)(
	"%s snapshots explicitly convert dates and exclude private fields",
	(domain, record) => {
		const snapshot = toSnapshot(parseStoredSnapshot(domain, record));
		expect(snapshot.domain).toBe(domain);
		expect(snapshot.record).toMatchObject({
			createdAt: "2026-10-01T01:02:03.000Z",
			updatedAt: "2026-10-02T01:02:03.000Z",
			exportedAt: null,
		});
		expect(snapshot.record).not.toHaveProperty("userId");
	},
);
test("explicit projections exclude extra fields even without a decoding pass", () => {
	const record = {
		...base,
		status: "UNEXPORTED" as const,
		title: "Note",
		markdown: "Body",
		secret: "hidden",
	};
	const dto = toDto("notes", record);
	expect(dto).not.toHaveProperty("secret");
	expect(dto).not.toHaveProperty("userId");
	expect(toDto("categories", { id: "category", name: "Name" })).toEqual({
		id: "category",
		name: "Name",
	});
});
test("invalid stored values fail at the persistence boundary", () => {
	expect(() =>
		parseReadModel("notes", {
			...base,
			title: "Note",
			markdown: "Body",
			createdAt: "yesterday",
		}),
	).toThrow(ZodError);
	expect(() =>
		parseReadModel("images", {
			...base,
			path: "x",
			contentType: "text/plain",
			fileSize: 1,
			width: null,
			height: null,
		}),
	).toThrow(ZodError);
});
