import { parseBookInput } from "@s-hirano-ist/s-backend/books/input";
import { makeUserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { expect, test, vi } from "vitest";
vi.mock("@s-hirano-ist/s-backend/shared/image-upload-parser", () => ({
	parseSupportedImageFile: vi.fn(async () => ({
		contentType: "image/png",
		originalBuffer: Buffer.from("png"),
		thumbnailBuffer: Buffer.from("thumbnail"),
	})),
}));
test("normalizes legacy CSV segments at the domain boundary without mutating operation hash input", async () => {
	const tags = [" a ", " b", " ", ""];
	const result = await parseBookInput(
		{
			isbn: "9781234567890",
			title: "Book",
			rating: 3,
			tags,
			image: new File(["png"], "cover.png", { type: "image/png" }),
		},
		makeUserId("owner"),
	);
	expect(result.tags).toEqual(["a", "b"]);
	expect(tags.join(",")).toBe(" a , b, ,");
});
