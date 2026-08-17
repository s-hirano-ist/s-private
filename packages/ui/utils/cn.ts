import { type ClassNameValue, twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind CSS conflict resolution.
 *
 * @remarks
 * Joins conditional classes and resolves Tailwind CSS class conflicts.
 *
 * @param inputs - Class values to merge (strings, arrays, and falsy values)
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
export function cn(...inputs: ClassNameValue[]) {
	return twMerge(...inputs);
}

/**
 * Merges static classes with Base UI's state-aware className callback.
 */
export function cnWithState<State>(
	className: string | ((state: State) => string | undefined) | undefined,
	...inputs: ClassNameValue[]
): string | ((state: State) => string) {
	if (typeof className === "function") {
		return (state) => cn(...inputs, className(state));
	}
	return cn(...inputs, className);
}
