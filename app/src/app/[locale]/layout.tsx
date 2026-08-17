import type { Metadata } from "next";
import "@/app/globals.css";
import { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { resolveContentSecurityPolicyNonce } from "@/common/security/content-security-policy-nonce";
import { Footer } from "@/components/common/layouts/nav/footer";
import { env } from "@/env";
import { IntlClientProvider } from "@/infrastructures/i18n/client-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@s-hirano-ist/s-ui/ui/toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getMessages } from "next-intl/server";
import { Noto_Sans_JP } from "next/font/google";
import { headers } from "next/headers";
import { locale } from "next/root-params";

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

export default async function RootLayout({
	children,
}: LayoutProps<"/[locale]">) {
	const headerStorePromise = headers();
	const localeValue = await locale();
	const [messages, headerStore] = await Promise.all([
		getMessages({ locale: localeValue }),
		headerStorePromise,
	]);
	const nonce = resolveContentSecurityPolicyNonce(
		headerStore.get("x-nonce"),
		env.NODE_ENV === "production",
	);

	return (
		<html lang={localeValue} suppressHydrationWarning>
			<head>
				{env.NODE_ENV === "development" && (
					<script
						async
						nonce={nonce}
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
						nonce={nonce}
					>
						<main className="min-h-screen">
							<div className="pb-24">{children}</div>
							<Footer search={searchContentFromClient} />
						</main>
						<Toaster />
					</ThemeProvider>
				</IntlClientProvider>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
