import { reportRenderError } from "@/common/observability/report-render-error";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { notFound, redirect } from "next/navigation";
import { beforeEach, expect, test, vi } from "vite-plus/test";

vi.mock("@/common/observability/report-render-error");
vi.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => key,
}));
vi.mock("next/navigation", async () => vi.importActual("next/navigation"));

beforeEach(() => vi.clearAllMocks());

test.each([
	["redirect", () => redirect("/api/sign-in"), "NEXT_REDIRECT"],
	["not found", () => notFound(), "NEXT_HTTP_ERROR_FALLBACK"],
] as const)(
	"preserves Next.js %s without reporting a render failure",
	async (_, navigate, message) => {
		await expect(
			ErrorBoundary({ errorCaller: "page", render: async () => navigate() }),
		).rejects.toThrow(message);
		expect(reportRenderError).not.toHaveBeenCalled();
	},
);

test("reports unexpected failures and preserves a custom fallback", async () => {
	const error = new Error("private detail");
	await expect(
		ErrorBoundary({
			errorCaller: "page",
			fallback: "Unable to load content",
			render: async () => {
				throw error;
			},
		}),
	).resolves.toBe("Unable to load content");
	expect(reportRenderError).toHaveBeenCalledWith(error, "page");
});
