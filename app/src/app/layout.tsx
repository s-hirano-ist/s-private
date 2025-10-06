import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_JP } from "next/font/google";
// FIXME: view transition does not work on search page
// import { unstable_ViewTransition as ViewTransitions } from "react";
import { env } from "@/env";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"] });

export default function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="ja" suppressHydrationWarning>
			{/*https://github.com/pacocoursey/next-themes*/}
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
	);
}
