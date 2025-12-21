import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind CSS conflict resolution.
 *
 * @remarks
 * Combines clsx for conditional classes with tailwind-merge
 * to properly handle Tailwind CSS class conflicts.
 *
 * @param inputs - Class values to merge (strings, arrays, objects)
 * @returns A merged class string with conflicts resolved
 *
 * @example
 * ```tsx
 * cn("px-2 py-1", "px-4")
 * // Returns: "py-1 px-4" (px-4 overrides px-2)
 *
 * cn("text-red-500", isActive && "text-blue-500")
 * // Conditionally applies classes
 * ```
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
