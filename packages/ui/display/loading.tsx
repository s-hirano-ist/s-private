/**
 * A centered loading indicator with pulsing dots.
 *
 * @remarks
 * Displays three dots with staggered pulse animation.
 * Used for loading states throughout the application.
 * Requires `loading-dot` keyframe defined in globals.css.
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
		<div className="flex h-full items-center justify-center gap-1.5 p-16">
			<div className="size-2 animate-[loading-dot_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
			<div className="size-2 animate-[loading-dot_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-primary" />
			<div className="size-2 animate-[loading-dot_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-primary" />
		</div>
	);
}

export default Loading;
