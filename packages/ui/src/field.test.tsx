import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Field, FieldError, FieldLabel } from "./field.js";
import { Input } from "./input.js";

describe("Field", () => {
	test("associates a label and exposes errors", () => {
		render(
			<Field>
				<FieldLabel htmlFor="name">Name</FieldLabel>
				<Input id="name" />
				<FieldError>Required</FieldError>
			</Field>,
		);
		expect(screen.getByLabelText("Name")).toBeTruthy();
		expect(screen.getByRole("alert").textContent).toBe("Required");
	});
});
