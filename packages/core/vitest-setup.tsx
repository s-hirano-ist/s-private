import { afterEach, beforeEach, vi } from "vite-plus/test";

vi.mock("uuid", () => ({
	v7: () => {
		return "01234567-89ab-7def-8123-456789abcd00";
	},
}));

afterEach(() => {});

beforeEach(() => {
	vi.clearAllMocks();
});
