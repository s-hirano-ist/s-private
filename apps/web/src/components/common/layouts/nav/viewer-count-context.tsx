"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ViewerDomain = "articles" | "books" | "images" | "notes";

type ViewerCount = { count: number; domain: ViewerDomain };
type ViewerCountContextValue = {
	setViewerCount: (value: ViewerCount | null) => void;
	viewerCount: ViewerCount | null;
};

const ViewerCountContext = createContext<ViewerCountContextValue | null>(null);

export function ViewerCountProvider({ children }: { children: ReactNode }) {
	const [viewerCount, setViewerCount] = useState<ViewerCount | null>(null);
	const value = useMemo(() => ({ setViewerCount, viewerCount }), [viewerCount]);
	return (
		<ViewerCountContext.Provider value={value}>
			{children}
		</ViewerCountContext.Provider>
	);
}

export function useViewerCount() {
	const context = useContext(ViewerCountContext);
	return context?.viewerCount ?? null;
}

export function ViewerCountSync({ domain, count }: ViewerCount) {
	const context = useContext(ViewerCountContext);
	if (!context) throw new Error("ViewerCountProvider is required");
	const { setViewerCount } = context;

	useEffect(() => {
		setViewerCount({ domain, count });
		return () => setViewerCount(null);
	}, [domain, count, setViewerCount]);

	return null;
}
