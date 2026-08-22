import type { ClassNameValue } from "tailwind-merge";
import { describe, expect, test } from "vitest";
import { cn, cnWithState } from "./cn.js";

describe("cn", () => {
	test("should merge class names correctly", () => {
		const class1: ClassNameValue = "bg-red-500";
		const class2: ClassNameValue = "text-white";
		const class3: ClassNameValue = "bg-red-500"; // 重複したクラス

		const result = cn(class1, class2, class3);

		expect(result).toBe("text-white bg-red-500");
	});

	test("should handle conditional class names", () => {
		const class1: ClassNameValue = "bg-red-500";
		const class2: ClassNameValue = false;
		const class3: ClassNameValue = "text-white";

		const result = cn(class1, class2, class3);

		expect(result).toBe("bg-red-500 text-white");
	});

	test("should handle array of class names", () => {
		const class1: ClassNameValue = ["bg-red-500", [false, "text-white"]];
		const class2: ClassNameValue = "font-bold";

		const result = cn(class1, class2);

		expect(result).toBe("bg-red-500 text-white font-bold");
	});

	test("should merge state-aware class names", () => {
		const className = cnWithState(
			(state: { className: string }) => state.className,
			"p-2",
			"bg-red-500",
		);

		expect(typeof className).toBe("function");
		const resolveClassName = className as (state: {
			className: string;
		}) => string;
		expect(resolveClassName({ className: "bg-blue-500" })).toBe(
			"p-2 bg-blue-500",
		);
		expect(resolveClassName({ className: "bg-gray-500" })).toBe(
			"p-2 bg-gray-500",
		);
	});
});
