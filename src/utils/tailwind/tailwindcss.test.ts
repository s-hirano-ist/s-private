import type { ClassValue } from "clsx";
import { describe, expect, test } from "vitest";
import { cn } from "./tailwindcss";

describe("cn", () => {
	test("should merge class names correctly", () => {
		const class1: ClassValue = "bg-red-500";
		const class2: ClassValue = "text-white";
		const class3: ClassValue = "bg-red-500"; // 重複したクラス

		const result = cn(class1, class2, class3);

		expect(result).toBe("text-white bg-red-500");
	});

	test("should handle conditional class names", () => {
		const class1: ClassValue = "bg-red-500";
		const class2: ClassValue = false;
		const class3: ClassValue = "text-white";

		const result = cn(class1, class2, class3);

		expect(result).toBe("bg-red-500 text-white");
	});

	test("should handle array of class names", () => {
		const class1: ClassValue = ["bg-red-500", "text-white"];
		const class2: ClassValue = "font-bold";

		const result = cn(class1, class2);

		expect(result).toBe("bg-red-500 text-white font-bold");
	});
});
