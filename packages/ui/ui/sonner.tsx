"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/**
 * Props for the Toaster component.
 *
 * @see {@link Toaster} for the component
 */
type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toast notification container component.
 *
 * @remarks
 * Wrapper around the Sonner toast library with theme integration.
 * Automatically adapts to the current theme (light/dark/system).
 * Default toast duration is 2000ms.
 *
 * @param props - Sonner Toaster props
 * @returns A toast container that displays notifications
 *
 * @example
 * ```tsx
 * // Add to your app layout
 * <Toaster />
 *
 * // Trigger toasts from anywhere
 * import { toast } from "sonner";
 * toast.success("Operation completed!");
 * toast.error("Something went wrong");
 * ```
 */
function Toaster({ ...props }: ToasterProps) {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			className="toaster group"
			duration={2000}
			theme={theme as ToasterProps["theme"]}
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-background group-[.toaster]:text-primary group-[.toaster]:shadow-lg",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-primary-grad group-[.toast]:text-primary",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
				},
			}}
			{...props}
		/>
	);
}

export { Toaster };
