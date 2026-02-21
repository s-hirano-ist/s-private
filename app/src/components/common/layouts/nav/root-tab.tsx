"use client";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@s-hirano-ist/s-ui/ui/tabs";
import { cn } from "@s-hirano-ist/s-ui/utils/cn";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useOptimistic, useTransition } from "react";

const TABS = {
	articles: "ARTICLES",
	notes: "NOTES",
	images: "IMAGES",
	books: "BOOKS",
} as const;

const TAB_KEYS = new Set(Object.keys(TABS));

type Props = {
	books: ReactNode;
	notes: ReactNode;
	images: ReactNode;
	articles: ReactNode;
};

const DEFAULT_TAB = "articles";

export function RootTab({ articles, books, notes, images }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	// Derive tab from searchParams - single source of truth
	const tabParam = searchParams.get("tab");
	const tab = tabParam && TAB_KEYS.has(tabParam) ? tabParam : DEFAULT_TAB;

	// Use optimistic for perceived performance
	const [optimisticTab, setOptimisticTab] = useOptimistic(tab);

	// Prefetch all tab routes on component mount
	useEffect(() => {
		const currentParams = new URLSearchParams(searchParams);
		Object.keys(TABS).forEach((tabKey) => {
			if (tabKey !== tab) {
				const prefetchParams = new URLSearchParams(currentParams);
				prefetchParams.set("tab", tabKey);
				prefetchParams.delete("page");
				router.prefetch(`?${prefetchParams.toString()}`);
			}
		});
	}, [router, searchParams, tab]);

	const handleTabChange = (value: string) => {
		startTransition(() => {
			setOptimisticTab(value);
			const params = new URLSearchParams(searchParams);
			params.delete("page");
			params.set("tab", value);
			router.replace(`?${params.toString()}`);
		});
	};

	// Redirect invalid tab values
	useEffect(() => {
		const currentTab = searchParams.get("tab");
		if (currentTab && !TAB_KEYS.has(currentTab)) {
			const params = new URLSearchParams(searchParams);
			params.delete("tab");
			router.replace(`?${params.toString()}`);
		}
	}, [searchParams, router]);

	const tabsList = (
		<TabsList className={cn("w-full", isPending && "opacity-50")}>
			{Object.entries(TABS).map(([key, value]) => {
				return (
					<TabsTrigger
						className="w-full"
						disabled={isPending}
						key={key}
						value={key}
					>
						{value}
					</TabsTrigger>
				);
			})}
		</TabsList>
	);

	return (
		<Tabs
			className="mx-auto max-w-5xl sm:px-2"
			defaultValue={DEFAULT_TAB}
			onValueChange={handleTabChange}
			value={optimisticTab}
		>
			{tabsList}
			<div className={cn(isPending && "opacity-50 pointer-events-none")}>
				<TabsContent value="articles">{articles}</TabsContent>
				<TabsContent value="notes">{notes}</TabsContent>
				<TabsContent value="books">{books}</TabsContent>
				<TabsContent value="images">{images}</TabsContent>
			</div>
		</Tabs>
	);
}
