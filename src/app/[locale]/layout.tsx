import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ReactNode } from "react";
import { Footer } from "@/components/common/layouts/nav/footer";
import { ThemeProvider } from "@/components/common/providers/theme-provider";
import { Toaster } from "@/components/common/ui/sonner";
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
					<Footer />
				</main>
				<Toaster />
			</ThemeProvider>
		</NextIntlClientProvider>
	);
}
