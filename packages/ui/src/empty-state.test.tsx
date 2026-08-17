import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import {
	EmptyState,
	EmptyStateDescription,
	EmptyStateTitle,
} from "./empty-state";

describe("EmptyState", () => {
	test("renders composable content", () => {
		render(
			<EmptyState>
				<EmptyStateTitle>Empty</EmptyStateTitle>
				<EmptyStateDescription>Nothing here</EmptyStateDescription>
			</EmptyState>,
		);
		expect(screen.getByRole("heading", { name: "Empty" })).toBeTruthy();
		expect(screen.getByText("Nothing here")).toBeTruthy();
	});
});
