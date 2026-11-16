import { needsTitleRepair } from "@s-hirano-ist/s-infrastructure/rss/title-repair";
import { expect, test } from "vitest";

const title =
	"「iPhone Duo」耐久テスト、45万回超の開閉でヒンジに異変　完全に開かず";

test("recognizes UTF-8 interpreted as a Western encoding without replacement characters", () => {
	const damaged = new TextDecoder("windows-1252").decode(Buffer.from(title));
	expect(damaged).not.toContain("\uFFFD");
	expect(needsTitleRepair(damaged, title)).toBe(true);
	expect(needsTitleRepair(Buffer.from(title).toString("latin1"), title)).toBe(
		true,
	);
});

test.each(["shift_jis", "euc-jp"])(
	"recognizes a legacy %s misdecode against the source title",
	(encoding) => {
		const damaged = new TextDecoder(encoding).decode(Buffer.from("テスト"));
		expect(needsTitleRepair(damaged, "テスト")).toBe(true);
	},
);

test("recognizes previously truncated damaged titles", () => {
	const fresh = "日本語".repeat(160);
	const damaged = new TextDecoder("windows-1252")
		.decode(Buffer.from(fresh))
		.slice(0, 512);
	expect(needsTitleRepair(damaged, fresh)).toBe(true);
});

test("retains normal, custom, and already repaired titles, and rejects a damaged source", () => {
	expect(needsTitleRepair(title, title)).toBe(false);
	expect(needsTitleRepair("自分で付けたタイトル", title)).toBe(false);
	expect(needsTitleRepair("縺という文字について", "別の記事")).toBe(false);
	expect(needsTitleRepair("Original title", "Updated title")).toBe(false);
	expect(needsTitleRepair("\uFFFD", "\uFFFD新しい文字化け")).toBe(false);
	expect(needsTitleRepair("\uFFFD", title)).toBe(true);
});
