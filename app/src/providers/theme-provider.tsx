"use client";

import type * as React from "react";
import { setNonce } from "get-nonce";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useInsertionEffect } from "react";

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
	nonce,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	useInsertionEffect(() => {
		setNonce(nonce ?? "");
	}, [nonce]);

	return (
		<NextThemesProvider nonce={nonce} {...props}>
			{children}
		</NextThemesProvider>
	);
}
