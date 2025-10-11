import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { ThemeProvider } from "s-private-components/providers/theme-provider";
import { Toaster } from "s-private-components/ui/sonner";
import { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { Footer } from "@/components/common/layouts/nav/footer";
import { routing } from "@/infrastructures/i18n/routing";

type Params = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Params) {
	const { locale } = await params;
	// Ensure that the incoming `locale` is valid
	if (!routing.locales.includes(locale as "en" | "ja")) {
		notFound();
	}

	const messages = await getMessages();

	return (
		<NextIntlClientProvider messages={messages}>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				disableTransitionOnChange
				enableSystem
			>
				<main className="flex h-screen flex-col justify-between">
					<div className="grow pb-4">{children}</div>
					<Footer search={searchContentFromClient} />
				</main>
				<Toaster />
			</ThemeProvider>
		</NextIntlClientProvider>
	);
}
