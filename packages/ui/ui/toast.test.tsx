import { act, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { toast, Toaster } from "./toast";

describe("Toaster", () => {
	test("renders notifications through the global manager", async () => {
		render(<Toaster />);

		act(() => {
			toast.success("Saved");
		});

		expect(await screen.findByText("Saved")).toBeVisible();
		expect(document.head.querySelector("style")).toBeNull();
	});
});
