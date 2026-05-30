"use client";

import type * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme provider component for dark/light mode support.
 *
 * @remarks
 * Wrapper around next-themes ThemeProvider.
 * Enables theme switching and system theme detection.
 *
 * @param props - next-themes provider props
 * @returns A theme context provider
 *
 * @example
 * ```tsx
 * // In your root layout
 * <ThemeProvider
 *   attribute="class"
 *   defaultTheme="system"
 *   enableSystem
 *   disableTransitionOnChange
 * >
 *   {children}
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
