/**
 * @packageDocumentation
 *
 * UI component library for the content management system.
 *
 * @remarks
 * This package provides reusable React components built with:
 * - Radix UI primitives for accessibility
 * - Tailwind CSS for styling
 * - class-variance-authority for variant management
 *
 * ## Component Categories
 *
 * - **UI Components** - Base components (Button, Card, Input, Dialog, etc.)
 * - **Form Components** - Form wrappers and field components
 * - **Display Components** - Loading states and status displays
 * - **Layout Components** - Markdown viewer and content layouts
 * - **Hooks** - Custom React hooks (useInfiniteScroll)
 * - **Providers** - Theme provider for dark/light mode
 * - **Utilities** - cn() class merging utility
 *
 * @example
 * ```tsx
 * import { Button, Card, Input, Toaster } from "@s-hirano-ist/s-ui";
 *
 * function MyComponent() {
 *   return (
 *     <Card>
 *       <Input placeholder="Enter text..." />
 *       <Button>Submit</Button>
 *       <Toaster />
 *     </Card>
 *   );
 * }
 * ```
 */

// UI Components

// Display Components
export * from "./display/loading";
export * from "./display/status/status-code-view";
export * from "./forms/fields/form-dropdown-input";
export * from "./forms/fields/form-file-input";
export * from "./forms/fields/form-input";
export * from "./forms/fields/form-input-with-button";
export * from "./forms/fields/form-textarea";
// Form Components
export * from "./forms/generic-form-wrapper";
// Hooks
export * from "./hooks/use-infinite-scroll";
// Layout Components
export * from "./layouts/body/viewer-body";
// Providers
export * from "./providers/theme-provider";
export * from "./ui/badge";
export * from "./ui/button";
export * from "./ui/card";
export * from "./ui/command";
export * from "./ui/dialog";
export * from "./ui/drawer";
export * from "./ui/dropdown-menu";
export * from "./ui/input";
export * from "./ui/label";
export * from "./ui/pagination";
export * from "./ui/sonner";
export * from "./ui/tabs";
export * from "./ui/textarea";

// Utilities
export * from "./utils/cn";
