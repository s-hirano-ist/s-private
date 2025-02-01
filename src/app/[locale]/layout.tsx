import { Footer } from "@/components/nav/footer";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Noto_Sans_JP } from "next/font/google";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

type Params = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"] });

export default async function LocaleLayout({ children, params }: Params) {
	const { locale } = await params;
	// Ensure that the incoming `locale` is valid
	if (!routing.locales.includes(locale as "en" | "ja")) {
		notFound();
	}

	// Providing all messages to the client side is the easiest way to get started
	const messages = await getMessages();

	return (
		<NextIntlClientProvider messages={messages}>
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
		</NextIntlClientProvider>
	);
}
