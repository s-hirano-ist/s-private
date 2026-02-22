import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PAGE_NAME } from "@/common/constants";
import { TabNav } from "@/components/common/layouts/nav/tab-nav";

export const metadata: Metadata = {
	title: `${PAGE_NAME}`,
	description: "Knowledge dumper and viewer.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="mx-auto max-w-5xl sm:px-2">
			<TabNav />
			{children}
		</div>
	);
}
