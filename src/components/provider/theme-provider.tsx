"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

export function ThemeProvider({
	children,
	...properties
}: React.ComponentProps<typeof NextThemesProvider>) {
	return <NextThemesProvider {...properties}>{children}</NextThemesProvider>;
}
