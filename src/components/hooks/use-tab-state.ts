"use client";
import { useSearchParams } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { useEffect, useState } from "react";

export function useTabState(
	validTabs: Record<string, string>,
	defaultTab: string = "news",
) {
	const router = useTransitionRouter();
	const searchParams = useSearchParams();

	const [tab, setTab] = useState(searchParams.get("tab") ?? defaultTab);

	const handleTabChange = (value: string) => {
		setTab(value);
		const params = new URLSearchParams(searchParams);
		params.set("tab", value);
		router.replace(`?${params.toString()}`);
	};

	useEffect(() => {
		const tabParam = searchParams.get("tab");
		if (!tabParam) return;

		const params = new URLSearchParams(searchParams);
		if (!Object.keys(validTabs).includes(tabParam)) {
			params.delete("tab");
			router.replace(`?${params.toString()}`);
			setTab(defaultTab);
		}
	}, [searchParams, router, validTabs, defaultTab]);

	return {
		currentTab: tab,
		handleTabChange,
		validTabs,
		defaultTab,
	};
}
