"use client";

/**
 * HTTP status codes supported by StatusCodeView.
 *
 * @remarks
 * - `000` - Custom status (e.g., no results)
 * - `204` - No Content
 * - `403` - Forbidden
 * - `404` - Not Found
 * - `500` - Internal Server Error
 */
export type StatusCode = "000" | "204" | "403" | "404" | "500";

/**
 * A stylized display for HTTP status codes.
 *
 * @remarks
 * Shows the status code prominently with a gradient effect
 * and an accompanying description text.
 *
 * @param props - Status code and description string
 * @returns A styled status code display
 *
 * @example
 * ```tsx
 * <StatusCodeView
 *   statusCode="404"
 *   statusCodeString="Page Not Found"
 * />
 * ```
 */
export function StatusCodeView({
	statusCode,
	statusCodeString,
}: {
	statusCode: StatusCode;
	statusCodeString: string;
}) {
	return (
		<div
			className="w-full bg-linear-to-r from-primary to-primary-grad bg-clip-text p-2 text-center font-extrabold text-transparent"
			data-testid="status-code-view"
		>
			<div className="text-9xl">
				<span className="hidden font-light sm:inline">---</span>
				{String(statusCode)}
				<span className="hidden font-light sm:inline">---</span>
			</div>
			<div className="text-sm">------{statusCodeString}------</div>
		</div>
	);
}
