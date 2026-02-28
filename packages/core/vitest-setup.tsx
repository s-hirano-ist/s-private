import { afterEach, beforeEach, vi } from "vitest";

vi.mock("uuid", () => ({
	v7: () => {
		return "01234567-89ab-7def-8123-456789abcd00";
	},
}));

vi.mock("sharp", () => {
	return {
		__esModule: true,
		default: vi.fn(() => ({
			metadata: vi.fn().mockResolvedValue({
				width: 800,
				height: 600,
			}),
			resize: vi.fn().mockReturnThis(),
			toBuffer: vi.fn().mockResolvedValue(Buffer.from("thumbnail")),
		})),
	};
});

afterEach(() => {});

beforeEach(() => {
	vi.clearAllMocks();
});
