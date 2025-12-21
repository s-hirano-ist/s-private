import { Loader } from "lucide-react";

/**
 * A centered loading spinner component.
 *
 * @remarks
 * Displays an animated spinner using Lucide's Loader icon.
 * Used for loading states throughout the application.
 *
 * @returns A centered loading indicator
 *
 * @example
 * ```tsx
 * {isLoading ? <Loading /> : <Content />}
 * ```
 */
function Loading() {
	return (
		<div className="flex h-full items-center justify-center p-16">
			<Loader className="animate-spin" size={48} />
		</div>
	);
}

export default Loading;
