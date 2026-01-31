"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../utils/cn";

/**
 * Root tabs container component.
 *
 * @remarks
 * Built on Radix UI Tabs primitive. Provides accessible tabbed interface.
 * Use with TabsList, TabsTrigger, and TabsContent for complete tab UI.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 * ```
 *
 * @see {@link TabsList} for the tab button container
 * @see {@link TabsTrigger} for individual tab buttons
 * @see {@link TabsContent} for tab panel content
 */
const Tabs = TabsPrimitive.Root;

type TabsListProps = {
	ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.List>>;
} & React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

/**
 * Container for tab trigger buttons.
 *
 * @remarks
 * Groups TabsTrigger components together with proper styling.
 *
 * @see {@link Tabs} for the parent container
 * @see {@link TabsTrigger} for individual tab buttons
 */
function TabsList({ className, ref, ...props }: TabsListProps) {
	return (
		<TabsPrimitive.List
			className={cn(
				"inline-flex h-9 items-center justify-center rounded-lg p-1 text-muted-foreground",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
TabsList.displayName = TabsPrimitive.List.displayName;

type TabsTriggerProps = {
	ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Trigger>>;
} & React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

/**
 * A tab button that activates a corresponding TabsContent panel.
 *
 * @remarks
 * Shows active state with gradient background.
 *
 * @see {@link TabsList} for the parent container
 * @see {@link TabsContent} for the associated content panel
 */
function TabsTrigger({ className, ref, ...props }: TabsTriggerProps) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium text-primary text-sm ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-linear-to-r data-[state=active]:from-primary data-[state=active]:to-primary-grad data-[state=active]:text-white",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

type TabsContentProps = {
	ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Content>>;
} & React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

/**
 * Content panel for a tab.
 *
 * @remarks
 * Only visible when its corresponding TabsTrigger is active.
 *
 * @see {@link Tabs} for the parent container
 * @see {@link TabsTrigger} for the associated trigger button
 */
function TabsContent({ className, ref, ...props }: TabsContentProps) {
	return (
		<TabsPrimitive.Content
			className={cn(
				"mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
