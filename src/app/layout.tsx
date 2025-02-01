import type { Metadata } from "next";
import { ViewTransitions } from "next-view-transitions";
import type { ReactNode } from "react";
import "./globals.css";
import { PAGE_NAME } from "@/constants";
import { env } from "@/env.mjs";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
	title: `${PAGE_NAME}`,
	description: "Private pages and admin tools for s-hirano-ist.",
};

export default function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<ViewTransitions>
			{/*https://github.com/pacocoursey/next-themes*/}
			<html lang="ja" suppressHydrationWarning>
				<head>
					{/* https://github.com/aidenybai/react-scan */}
					{env.NODE_ENV === "development" && (
						<script
							src="https://unpkg.com/react-scan/dist/auto.global.js"
							async
						/>
					)}
				</head>
				{children}
				<GoogleAnalytics gaId={env.NEXT_PUBLIC_G_TAG} />
			</html>
		</ViewTransitions>
	);
}
