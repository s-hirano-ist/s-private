import type { Metadata } from "next";
import { ViewTransitions } from "next-view-transitions";
import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_JP } from "next/font/google";
import { PAGE_NAME } from "@/constants";
import { env } from "@/env";

export const metadata: Metadata = {
	title: `${PAGE_NAME}`,
	description: "Private pages and admin tools for s-hirano-ist.",
};

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"] });

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
							async
							src="https://unpkg.com/react-scan/dist/auto.global.js"
						/>
					)}
				</head>
				<body className={notoSansJp.className}>
					{children}
					<Analytics />
					<SpeedInsights />
				</body>
			</html>
		</ViewTransitions>
	);
}
