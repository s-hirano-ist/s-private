import { AddImageForm } from "@/features/image/components/add-image-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("AddImageForm", () => {
	it("renders input fields and buttons correctly", () => {
		render(<AddImageForm />);

		expect(screen.getByLabelText("画像")).toBeInTheDocument();
		expect(screen.getByText("アップロード")).toBeInTheDocument();
	});
});
