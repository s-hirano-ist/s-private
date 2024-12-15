import type { Status } from "@/features/dump/types";
import type { Role, Scope } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
	formatChangeStatusMessage,
	formatCreateCategoryMessage,
	formatCreateContentsMessage,
	formatCreateImageMessage,
	formatCreateNewsMessage,
	formatDeleteMessage,
	formatUpdateRoleMessage,
	formatUpdateScopeMessage,
} from "./format-for-line";

describe("formatDeleteMessage", () => {
	it("should format the delete message correctly", () => {
		const id = 1;
		const contentName = "NEWS";

		const result = formatDeleteMessage(id, contentName);

		expect(result).toBe("【NEWS】\n\n更新\nID: 1");
	});
});

describe("formatChangeStatusMessage", () => {
	it("should format the change status message correctly", () => {
		const changeStatus: Status = {
			unexported: 5,
			recentlyUpdated: 3,
			exported: 7,
		};
		const contentName = "NEWS";

		const result = formatChangeStatusMessage(changeStatus, contentName);

		expect(result).toBe("【NEWS】\n\n更新\n未処理: 5\n直近更新: 3\n確定: 7");
	});
});

describe("formatCreateCategoryMessage", () => {
	it("should format the create category message correctly", () => {
		const category = "新しいカテゴリー";
		const contentName = "NEWS";

		const result = formatCreateCategoryMessage(category, contentName);

		expect(result).toBe(
			"【NEWS】\n\nカテゴリー\n新しいカテゴリー\nの登録ができました",
		);
	});
});

describe("formatCreateNewsMessage", () => {
	it("should format the create news message correctly", () => {
		const title = "新しいニュース";
		const quote = "これは引用です";
		const url = "https://example.com";
		const Category = {
			id: 1,
			name: "カテゴリー",
			userId: "xxx",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = formatCreateNewsMessage({ title, quote, url, Category });

		expect(result).toBe(
			"【NEWS】\n\nコンテンツ\ntitle: 新しいニュース \nquote: これは引用です \nurl: https://example.com\ncategory: カテゴリー\nの登録ができました",
		);
	});

	it("should format the create contents message correctly", () => {
		const title = "新しいニュース";
		const quote = "これは引用です";
		const url = "https://example.com";

		const result = formatCreateContentsMessage({ title, quote, url });

		expect(result).toBe(
			"【CONTENTS】\n\nコンテンツ\ntitle: 新しいニュース \nquote: これは引用です \nurl: https://example.com\nの登録ができました",
		);
	});
});

describe("formatCreateImageMesasge", () => {
	it("should format the create image message correctly", () => {
		const fileName = "xx.jpg";

		const result = formatCreateImageMessage({ fileName });

		expect(result).toBe(
			"【IMAGE】\n\nコンテンツ\nfileName: xx.jpg\nの登録ができました",
		);
	});
});

describe("formatUpdateScopeMessage", () => {
	it("should format the update scope message correctly", () => {
		const scope: Scope = "PRIVATE";

		const result = formatUpdateScopeMessage(scope);

		expect(result).toBe("【SCOPE】\n\nscope: PRIVATE\nに変更しました");
	});
});

describe("formatUpdateRoleMessage", () => {
	it("should format the update role message correctly", () => {
		const role: Role = "ADMIN";

		const result = formatUpdateRoleMessage(role);

		expect(result).toBe("【ROLE】\n\nrole: ADMIN\nに変更しました");
	});
});
