"use client";

import { Profiler, type ProfilerOnRenderCallback } from "react";

export type ProfilerResult = {
	id: string;
	phase: "mount" | "update" | "nested-update";
	actualDuration: number;
	baseDuration: number;
	startTime: number;
	commitTime: number;
};

type ProfilerWrapperProps = {
	id: string;
	/** Whether profiling is enabled. Defaults to true. Set to false in production. */
	enabled?: boolean;
	/** Warning threshold in ms. Defaults to 16 (one frame at 60fps). */
	threshold?: number;
	/** Programmatic data collection callback. */
	onCollect?: (result: ProfilerResult) => void;
	children: React.ReactNode;
};

function DevProfilerWrapper({
	id,
	threshold = 16,
	onCollect,
	children,
}: ProfilerWrapperProps) {
	const onRender: ProfilerOnRenderCallback = (
		id,
		phase,
		actualDuration,
		baseDuration,
		startTime,
		commitTime,
	) => {
		const result: ProfilerResult = {
			id,
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
				`[Profiler] ${id} ${phase}: ${actualDuration.toFixed(1)}ms (threshold: ${threshold}ms)`,
			);
		} else {
			console.debug(
				`[Profiler] ${id} ${phase}: ${actualDuration.toFixed(1)}ms`,
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
