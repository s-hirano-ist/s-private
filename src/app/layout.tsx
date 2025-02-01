import { Footer } from "@/components/nav/footer";
import type { Metadata } from "next";
import { ViewTransitions } from "next-view-transitions";
import { Noto_Sans_JP } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PAGE_NAME } from "@/constants";
import { env } from "@/env.mjs";
import { GoogleAnalytics } from "@next/third-parties/google";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"] });

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
				<body className={notoSansJp.className}>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<main className="flex h-screen flex-col justify-between">
							<div className="grow pb-4">{children}</div>
							<Footer />
						</main>
						<Toaster />
					</ThemeProvider>
				</body>
				<GoogleAnalytics gaId={env.NEXT_PUBLIC_G_TAG} />
			</html>
		</ViewTransitions>
	);
}
