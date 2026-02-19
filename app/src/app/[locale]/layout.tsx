import Loading from "@s-hirano-ist/s-ui/display/loading";
import { ThemeProvider } from "@s-hirano-ist/s-ui/providers/theme-provider";
import { Toaster } from "@s-hirano-ist/s-ui/ui/sonner";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Suspense, type ReactNode } from "react";
import { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { Footer } from "@/components/common/layouts/nav/footer";
import { routing } from "@/infrastructures/i18n/routing";

const VALID_LOCALES = new Set(routing.locales);

type Params = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

async function LocaleLayoutContent({
	children,
	params,
}: Params) {
	const { locale } = await params;
	// Ensure that the incoming `locale` is valid
	if (!VALID_LOCALES.has(locale as "en" | "ja")) {
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

export default function LocaleLayout({ children, params }: Params) {
	return (
		<Suspense fallback={<Loading />}>
			<LocaleLayoutContent params={params}>{children}</LocaleLayoutContent>
		</Suspense>
	);
}
