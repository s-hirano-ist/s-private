/**
 * Next.js-dependent components.
 *
 * @remarks
 * This entry point exports components that depend on Next.js or next-themes.
 * Use this import path in Next.js projects:
 *
 * @example
 * ```tsx
 * import { ThemeProvider, Toaster, Pagination } from "@s-hirano-ist/s-ui/next";
 * ```
 */

// Providers
export * from "./providers/theme-provider";

// UI Components (Next.js dependent)
export * from "./ui/pagination";
export * from "./ui/sonner";
