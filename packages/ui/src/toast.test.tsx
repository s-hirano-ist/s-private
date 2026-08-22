import { act, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ToastProvider, useToast } from "./toast.js";

function Trigger() {
	const toast = useToast();
	return <button onClick={() => toast.success("Saved")}>Notify</button>;
}

describe("ToastProvider", () => {
	test("scopes notifications to its provider", async () => {
		render(
			<ToastProvider>
				<Trigger />
			</ToastProvider>,
		);
		act(() => screen.getByRole("button", { name: "Notify" }).click());
		expect(await screen.findByText("Saved")).toBeTruthy();
	});
});
