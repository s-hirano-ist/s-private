import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_JP } from "next/font/google";
import { headers } from "next/headers";
// FIXME: Enable View Transitions when the API is stable.
// Note: View Transitions disabled due to React 19 unstable_ViewTransition
// conflicting with Drawer/Dialog components on the Search page.
// This is a known issue with the experimental API. Re-evaluate when
// React provides a stable View Transitions API.
// import { unstable_ViewTransition as ViewTransitions } from "react";
import { env } from "@/env";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
	title: {
		default: "s-private",
		template: "%s | s-private",
	},
	description: "Dumper and Viewer of s-hirano-ist's memories.",
	robots: {
		index: false,
		follow: false,
	},
};

async function ReactScanScript() {
	const nonce = (await headers()).get("x-nonce") ?? "";
	return (
		<script
			async
			nonce={nonce}
			src="https://unpkg.com/react-scan/dist/auto.global.js"
		/>
	);
}

export default function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="ja" suppressHydrationWarning>
			{/*https://github.com/pacocoursey/next-themes*/}
			<head>
				{/* https://github.com/aidenybai/react-scan */}
				{env.NODE_ENV === "development" && (
					<Suspense>
						<ReactScanScript />
					</Suspense>
				)}
			</head>
			<body className={notoSansJp.className}>
				{children}
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
