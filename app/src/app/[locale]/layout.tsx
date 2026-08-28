import type { Metadata } from "next";
import "@/app/globals.css";
import { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { Footer, FooterFallback } from "@/components/common/layouts/nav/footer";
import { env } from "@/env";
import { IntlClientProvider } from "@/infrastructures/i18n/client-provider";
import { loadMessages } from "@/infrastructures/i18n/request";
import { routing } from "@/infrastructures/i18n/routing-config";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@s-hirano-ist/s-ui/toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_JP } from "next/font/google";
import { locale } from "next/root-params";
import { Suspense } from "react";

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

export function generateStaticParams() {
	return routing.locales.map((localeValue) => ({ locale: localeValue }));
}

export default async function RootLayout({
	children,
}: LayoutProps<"/[locale]">) {
	const localeValue = await locale();
	const messages = await loadMessages(localeValue);

	return (
		<html lang={localeValue} suppressHydrationWarning>
			<head>
				{env.NODE_ENV === "development" && (
					<script
						async
						src="https://unpkg.com/react-scan/dist/auto.global.js"
					/>
				)}
			</head>
			<body className={notoSansJp.className}>
				<IntlClientProvider locale={localeValue} messages={messages}>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						disableTransitionOnChange
						enableSystem
					>
						<ToastProvider dismissLabel="通知を閉じる">
							<main className="min-h-screen">
								<div className="pb-24">{children}</div>
								<Suspense fallback={<FooterFallback />}>
									<Footer search={searchContentFromClient} />
								</Suspense>
							</main>
						</ToastProvider>
					</ThemeProvider>
				</IntlClientProvider>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
