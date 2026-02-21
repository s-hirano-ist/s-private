"use client";

import {
	AlertTriangleIcon,
	ClockIcon,
	InboxIcon,
	SearchXIcon,
	ShieldXIcon,
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * HTTP status codes supported by StatusCodeView.
 *
 * @remarks
 * - `000` - Custom status (e.g., coming soon)
 * - `204` - No Content
 * - `403` - Forbidden
 * - `404` - Not Found
 * - `500` - Internal Server Error
 */
export type StatusCode = "000" | "204" | "403" | "404" | "500";

const STATUS_ICON_MAP: Record<StatusCode, ReactNode> = {
	"000": <ClockIcon className="size-8 text-primary" />,
	"204": <InboxIcon className="size-8 text-primary" />,
	"403": <ShieldXIcon className="size-8 text-primary" />,
	"404": <SearchXIcon className="size-8 text-primary" />,
	"500": <AlertTriangleIcon className="size-8 text-primary" />,
};

/**
 * A stylized display for HTTP status codes.
 *
 * @remarks
 * Shows the status code with an icon, gradient number, and description text.
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
			className="flex animate-[card-enter_300ms_ease-out_both] flex-col items-center gap-3 py-12"
			data-testid="status-code-view"
		>
			<div className="rounded-full bg-primary/10 p-4">
				{STATUS_ICON_MAP[statusCode]}
			</div>
			<div className="bg-linear-to-r from-primary to-primary-grad bg-clip-text font-black text-8xl text-transparent tracking-tighter">
				{String(statusCode)}
			</div>
			<div className="text-base text-muted-foreground">{statusCodeString}</div>
		</div>
	);
}
