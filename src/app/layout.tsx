import { Footer } from "@/components/nav/footer";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { ViewTransitions } from "next-view-transitions";
import { Noto_Sans_JP } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { PAGE_NAME } from "@/constants";
import { env } from "@/env.mjs";
import { NonceProvider } from "@/nonce-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { headers } from "next/headers";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: `${PAGE_NAME}`,
	description: "Private pages and admin tools for s-hirano-ist.",
};

export default async function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	const nonce = (await headers()).get("x-nonce") ?? undefined;
	console.log("nonce", nonce);

	return (
		// <ViewTransitions>
		<html lang="ja">
			<body className={notoSansJp.className}>
				<NonceProvider nonce={nonce}>
					<main className="flex h-screen flex-col justify-between">
						<div className="grow pb-4">{children}</div>
						<Footer />
					</main>
					{/* <Toaster /> */}
				</NonceProvider>
			</body>
			<GoogleAnalytics gaId={env.NEXT_PUBLIC_G_TAG} nonce={nonce} />
		</html>
		// </ViewTransitions>
	);
}
