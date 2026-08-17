"use client";

import type * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cnWithState } from "./utils/cn";

const Tabs = TabsPrimitive.Root;

function TabsList({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			className={cnWithState(
				className,
				"sui:inline-flex sui:h-10 sui:items-center sui:justify-center sui:border-b sui:border-muted sui:p-1 sui:text-muted-foreground",
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
				"sui:inline-flex sui:items-center sui:justify-center sui:border-b-2 sui:border-transparent sui:px-3 sui:py-2 sui:text-sm sui:font-medium sui:whitespace-nowrap sui:text-muted-foreground sui:ring-offset-background sui:transition-all sui:duration-200 sui:hover:text-foreground sui:focus-visible:ring-2 sui:focus-visible:ring-primary sui:focus-visible:ring-offset-2 sui:focus-visible:outline-hidden sui:disabled:pointer-events-none sui:disabled:opacity-50 sui:data-active:border-primary sui:data-active:font-bold sui:data-active:text-foreground",
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
				"sui:mt-2 sui:ring-offset-background sui:focus-visible:ring-2 sui:focus-visible:ring-primary sui:focus-visible:ring-offset-2 sui:focus-visible:outline-hidden",
			)}
			data-slot="tabs-content"
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
