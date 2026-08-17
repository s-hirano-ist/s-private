"use client";

import type * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cnWithState } from "../utils/cn";

const Tabs = TabsPrimitive.Root;

function TabsList({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			className={cnWithState(
				className,
				"inline-flex h-10 items-center justify-center border-b border-muted p-1 text-muted-foreground",
			)}
			data-slot="tabs-list"
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
	return (
		<TabsPrimitive.Tab
			className={cnWithState(
				className,
				"inline-flex items-center justify-center border-b-2 border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-all duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-active:border-primary data-active:font-bold data-active:text-primary",
			)}
			data-slot="tabs-trigger"
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Panel>) {
	return (
		<TabsPrimitive.Panel
			className={cnWithState(
				className,
				"mt-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-hidden",
			)}
			data-slot="tabs-content"
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
