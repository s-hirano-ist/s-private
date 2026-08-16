"use client";

import { Profiler, type ProfilerOnRenderCallback } from "react";

export type ProfilerResult = {
	actualDuration: number;
	baseDuration: number;
	commitTime: number;
	id: string;
	phase: "mount" | "update" | "nested-update";
	startTime: number;
};

type ProfilerWrapperProps = {
	children: React.ReactNode;
	/** Whether profiling is enabled. Defaults to true. Set to false in production. */
	enabled?: boolean;
	id: string;
	/** Programmatic data collection callback. */
	onCollect?: (result: ProfilerResult) => void;
	/** Warning threshold in ms. Defaults to 16 (one frame at 60fps). */
	threshold?: number;
};

function DevProfilerWrapper({
	id,
	threshold = 16,
	onCollect,
	children,
}: ProfilerWrapperProps) {
	const onRender: ProfilerOnRenderCallback = (
		renderedId,
		phase,
		actualDuration,
		baseDuration,
		startTime,
		commitTime,
	) => {
		const result: ProfilerResult = {
			id: renderedId,
			phase,
			actualDuration,
			baseDuration,
			startTime,
			commitTime,
		};

		if (onCollect) {
			onCollect(result);
		}

		if (actualDuration > threshold) {
			console.warn(
				`[Profiler] ${renderedId} ${phase}: ${actualDuration.toFixed(1)}ms (threshold: ${threshold}ms)`,
			);
		} else {
			console.debug(
				`[Profiler] ${renderedId} ${phase}: ${actualDuration.toFixed(1)}ms`,
			);
		}
	};

	return (
		<Profiler id={id} onRender={onRender}>
			{children}
		</Profiler>
	);
}

/**
 * Development-only React Profiler wrapper.
 * When `enabled` is false (default in production), renders children directly with zero overhead.
 */
export function ProfilerWrapper({
	children,
	enabled = true,
	...rest
}: ProfilerWrapperProps) {
	if (!enabled) {
		return children;
	}

	return <DevProfilerWrapper {...rest}>{children}</DevProfilerWrapper>;
}
