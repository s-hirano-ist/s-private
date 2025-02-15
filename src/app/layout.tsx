import type { Metadata } from "next";
import { ViewTransitions } from "next-view-transitions";
import type { ReactNode } from "react";
import "./globals.css";
import QueryClientProvider from "@/components/provider/query-provider";
import { PAGE_NAME } from "@/constants";
import { env } from "@/env";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_JP } from "next/font/google";

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
							src="https://unpkg.com/react-scan/dist/auto.global.js"
							async
						/>
					)}
				</head>
				<QueryClientProvider>
					<body className={notoSansJp.className}>
						{children}
						<Analytics />
						<SpeedInsights />
					</body>
				</QueryClientProvider>
				<GoogleAnalytics gaId={env.NEXT_PUBLIC_G_TAG} />
			</html>
		</ViewTransitions>
	);
}
