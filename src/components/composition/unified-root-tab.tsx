"use client";
import { type ReactNode } from "react";
import { useTabState } from "@/components/hooks/use-tab-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabContentProps = {
	value: string;
	children: ReactNode;
};

type UnifiedRootTabProps = {
	tabs: Record<string, string>;
	defaultTab?: string;
	children: React.ReactElement<TabContentProps>[];
	className?: string;
};

function TabContentWrapper({ value, children }: TabContentProps) {
	return <TabsContent value={value}>{children}</TabsContent>;
}

export function UnifiedRootTab({
	tabs,
	defaultTab = "news",
	children,
	className = "mx-auto max-w-5xl sm:px-2",
}: UnifiedRootTabProps) {
	const { currentTab, handleTabChange } = useTabState(tabs, defaultTab);

	return (
		<Tabs
			className={className}
			defaultValue={defaultTab}
			onValueChange={handleTabChange}
			value={currentTab}
		>
			<TabsList className="w-full">
				{Object.entries(tabs).map(([key, value]) => (
					<TabsTrigger className="w-full" key={key} value={key}>
						{value}
					</TabsTrigger>
				))}
			</TabsList>
			{children}
		</Tabs>
	);
}

UnifiedRootTab.Content = TabContentWrapper;
